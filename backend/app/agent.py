import os
import json
import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.exceptions import LangChainException

from app.models import AgentState, Word, EditInstruction, Transcript, CreatorContext, SmartMergeSegment
from app.state_manager import StateManager
from app.utils import extract_words_from_transcript, words_to_transcript
from app.smart_merge import analyze_and_reorder_segments
from app.context_detector import detect_creator_context

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
_shared_data_env = os.getenv('SHARED_DATA_DIR')
if _shared_data_env:
    SHARED_DATA_DIR = os.path.abspath(_shared_data_env)
else:
    SHARED_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'shared-data'))
TRANSCRIPTS_DIR = os.path.join(SHARED_DATA_DIR, 'transcripts')

logger.info(f"[agent CONFIG] SHARED_DATA_DIR: {SHARED_DATA_DIR}")
logger.info(f"[agent CONFIG] TRANSCRIPTS_DIR: {TRANSCRIPTS_DIR}")

os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)

state_manager = StateManager(TRANSCRIPTS_DIR)

llm = ChatOpenAI(
    model='gpt-4o',
    temperature=0.3,
    api_key=OPENAI_API_KEY,
    timeout=60,
    max_retries=3,
)


async def call_llm_with_retry(messages: List[Any], max_retries: int = 3) -> Any:
    """
    Call LLM with retry logic for transient failures.
    
    Args:
        messages: List of messages to send to LLM
        max_retries: Maximum number of retry attempts
    
    Returns:
        LLM response
    
    Raises:
        Exception if all retries are exhausted
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            result = await asyncio.wait_for(
                llm.ainvoke(messages),
                timeout=90
            )
            logger.info(f"LLM call succeeded on attempt {attempt + 1}")
            return result
            
        except asyncio.TimeoutError:
            last_error = f"LLM response timed out (90s)"
            logger.warning(f"{last_error} (attempt {attempt + 1}/{max_retries})")
            
        except LangChainException as e:
            if 'rate limit' in str(e).lower():
                last_error = f"Rate limit exceeded: {str(e)}"
                logger.warning(f"{last_error} (attempt {attempt + 1}/{max_retries})")
            else:
                last_error = f"LangChain error: {str(e)}"
                logger.error(f"{last_error} (attempt {attempt + 1}/{max_retries})")
                
        except Exception as e:
            last_error = f"Unexpected error: {str(e)}"
            logger.error(f"{last_error} (attempt {attempt + 1}/{max_retries})")
        
        if attempt < max_retries - 1:
            delay = (2 ** attempt) * 3.0
            logger.info(f"Retrying LLM call in {delay}s...")
            await asyncio.sleep(delay)
    
    raise Exception(f"LLM call failed after {max_retries} attempts: {last_error}")

def convert_word_indices_to_time_ranges(
    words: List[Word],
    word_indices: List[int]
) -> List[Tuple[float, float]]:
    """
    Convert word indices to time ranges for deletion.
    Groups consecutive word indices into continuous time ranges.
    
    Args:
        words: List of Word objects with timestamps
        word_indices: List of word indices to delete (0-based)
    
    Returns:
        List of (start, end) time range tuples
    """
    if not words or not word_indices:
        return []
    
    # Sort and validate indices
    sorted_indices = sorted(set(word_indices))
    valid_indices = [idx for idx in sorted_indices if 0 <= idx < len(words)]
    
    if not valid_indices:
        return []
    
    # Group consecutive indices into ranges
    ranges = []
    range_start_idx = valid_indices[0]
    range_start_time = words[range_start_idx].start
    
    for i in range(1, len(valid_indices)):
        # If indices are not consecutive, finalize current range
        if valid_indices[i] != valid_indices[i-1] + 1:
            # End time is the end of the last word in the range
            range_end_time = words[valid_indices[i-1]].end
            ranges.append((range_start_time, range_end_time))
            
            # Start new range
            range_start_idx = valid_indices[i]
            range_start_time = words[range_start_idx].start
    
    # Don't forget the last range
    range_end_time = words[valid_indices[-1]].end
    ranges.append((range_start_time, range_end_time))
    
    return ranges

def merge_overlapping_ranges(
    ranges: List[Tuple[float, float]]
) -> List[Tuple[float, float]]:
    """
    Merge overlapping time ranges and remove duplicates.
    
    Args:
        ranges: List of (start, end) time range tuples
    
    Returns:
        List of merged, non-overlapping time ranges
    """
    if not ranges:
        return []
    
    # Sort by start time
    sorted_ranges = sorted(ranges, key=lambda x: x[0])
    
    merged = []
    current_start, current_end = sorted_ranges[0]
    
    for start, end in sorted_ranges[1:]:
        # If ranges overlap or are adjacent (within 0.1s), merge them
        if start <= current_end + 0.1:
            current_end = max(current_end, end)
        else:
            # No overlap, finalize current range
            merged.append((current_start, current_end))
            current_start, current_end = start, end
    
    # Add the last range
    merged.append((current_start, current_end))
    
    return merged

def analyze_query(state: AgentState) -> AgentState:
    """
    Analyze user query to determine edit intent.
    """
    query = state.user_query
    
    system_prompt = """You are a video editing assistant. Analyze the user's query and determine:
1. What type of edit is requested (e.g., 'delete', 'trim', 'cut_silence', 'make_snappier')
2. What specific words/sentences/references are mentioned
3. Any time-based references

Return a JSON with:
{
    "intent": "type_of_edit",
    "targets": ["specific_words_or_references"],
    "description": "human_readable_description"
}"""

    try:
        print("User Query: ", query)
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=query)
        ], timeout=30)
        
        # Handle case where content might be str or list
        content = response.content
        if isinstance(content, list):
            content = " ".join(str(item) for item in content)
        result_text = str(content).strip()
        
        if result_text.startswith('```json'):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith('```'):
            result_text = result_text[3:-3].strip()
        
        analysis = json.loads(result_text)
        
        state.edit_intent = analysis.get('intent', 'unknown')
        state.message = analysis.get('description', f'Analyzing: {query}')
        
    except Exception as e:
        state.edit_intent = 'unknown'
        state.message = f'Could not analyze query: {str(e)}'
    
    return state

async def fetch_transcript(state: AgentState) -> AgentState:
    """
    Fetch current transcript for the job.
    Falls back to basic time-based editing if transcript is unavailable.
    """
    try:
        transcript = await state_manager.load_transcript(state.job_id)
        
        if transcript and transcript.clips:
            state.current_transcript = extract_words_from_transcript(transcript)
            state.message = 'Transcript loaded successfully'
        else:
            state.current_transcript = None
            state.message = 'No transcript available - using time-based editing fallback'
            logger.warning(f"No transcript found for job {state.job_id}, switching to fallback mode")
    
    except Exception as e:
        state.current_transcript = None
        state.message = f'Error fetching transcript: {str(e)} - using time-based editing fallback'
        logger.warning(f"Transcript error for job {state.job_id}: {str(e)}")
    
    return state

def determine_edits(state: AgentState) -> AgentState:
    """
    Use GPT-4o to determine word indices/time ranges to edit.
    Falls back to simpler time-based analysis if transcript is unavailable.
    """
    if not state.current_transcript:
        system_prompt = f"""You are a video editing expert. The user wants to edit a video but no transcript is available.

User request: {state.user_query}
Edit intent: {state.edit_intent}
Estimated video duration: Use context clues or default to 60 seconds if unknown

Determine time-based edits based on the user's request.
For example:
- "Remove the first 10 seconds" -> [[0, 10]]
- "Cut out the middle part from 20 to 40 seconds" -> [[20, 40]]
- "Remove the last 5 seconds" -> [[55, 60]]

Return a JSON object with:
{{
    "words_to_delete": [],  // Empty array when no transcript
    "time_ranges_to_delete": [[start1, end1], [start2, end2]],  // Time ranges in seconds
    "reasoning": "Explanation of the time-based edits"
}}"""

        try:
            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content="Determine the time ranges to edit.")
            ], timeout=90)
            
            # Handle case where content might be str or list
            content = response.content
            if isinstance(content, list):
                content = " ".join(str(item) for item in content)
            result_text = str(content).strip()
            
            if result_text.startswith('```json'):
                result_text = result_text[7:-3].strip()
            elif result_text.startswith('```'):
                result_text = result_text[3:-3].strip()
            
            analysis = json.loads(result_text)
            time_ranges = analysis.get('time_ranges_to_delete', [])
            
            state.time_ranges_to_delete = [(r[0], r[1]) for r in time_ranges]
            state.message = analysis.get('reasoning', f'Determined {len(time_ranges)} time ranges to remove')
            logger.info(f"Fallback mode: determined {len(time_ranges)} time ranges for job {state.job_id}")
            
        except Exception as e:
            state.message = f'Error determining time-based edits: {str(e)}'
            logger.error(f"Fallback edit error for job {state.job_id}: {str(e)}")
        
        return state
    
    words_text = json.dumps([w.model_dump() for w in state.current_transcript], indent=2)
    
    system_prompt = f"""You are a video editing expert with access to a timestamped transcript.

Current transcript with timestamps:
{words_text}

Analyze the user's request and determine:
1. Which specific words should be deleted (by index)
2. What time ranges should be cut from the video
3. The reasoning behind each edit

User request: {state.user_query}
Edit intent: {state.edit_intent}

Return a JSON object with:
{{
    "words_to_delete": [0, 1, 2],  // Array of word indices to delete
    "time_ranges_to_delete": [[start1, end1], [start2, end2]],  // Time ranges in seconds
    "reasoning": "Explanation of why these edits match the request"
}}

IMPORTANT:
- word indices are 0-based and correspond to the transcript array above
- time_ranges_to_delete should be the start and end seconds for each segment to remove
- Only mark words/ranges for deletion if they match the user's intent
- Keep words that contribute to the content the user wants to keep
"""

    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt)
        ], timeout=90)
        
        # Handle case where content might be str or list
        content = response.content
        if isinstance(content, list):
            content = " ".join(str(item) for item in content)
        result_text = str(content).strip()
        
        if result_text.startswith('```json'):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith('```'):
            result_text = result_text[3:-3].strip()
        
        analysis = json.loads(result_text)
        
        word_indices = analysis.get('words_to_delete', [])
        time_ranges = analysis.get('time_ranges_to_delete', [])
        
        # Convert word indices to time ranges for precise word-level deletion
        word_based_ranges = []
        if word_indices and state.current_transcript:
            word_based_ranges = convert_word_indices_to_time_ranges(
                state.current_transcript, 
                word_indices
            )
            logger.info(f"Converted {len(word_indices)} word indices to {len(word_based_ranges)} time ranges for job {state.job_id}")
        
        # Merge word-based ranges with LLM-provided time ranges
        # Convert LLM time ranges from lists to tuples
        llm_ranges = [(r[0], r[1]) for r in time_ranges] if time_ranges else []
        all_time_ranges = llm_ranges + word_based_ranges
        
        # Remove duplicates and sort
        unique_ranges = merge_overlapping_ranges(all_time_ranges)
        
        state.time_ranges_to_delete = unique_ranges
        
        total_words = len(word_indices) if word_indices else 0
        total_ranges = len(unique_ranges)
        state.message = analysis.get('reasoning', f'Determined {total_words} words and {total_ranges} time ranges to remove')
        
    except Exception as e:
        state.message = f'Error determining edits: {str(e)}'
        logger.error(f"Edit determination error for job {state.job_id}: {e}", exc_info=True)
    
    return state

async def call_mcp_tools(state: AgentState) -> AgentState:
    """
    Call MCP server tools to perform the edits.
    Now supports both 'cut' and 'keep' instructions:
    - If edit_instructions is set (smart merge), use those
    - Otherwise, convert time_ranges_to_delete to 'cut' instructions
    """
    import httpx
    
    mcp_server_url = os.getenv('MCP_SERVER_URL', 'http://localhost:9000')
    
    async with httpx.AsyncClient() as client:
        try:
            job_data = await state_manager.load_job(state.job_id)
            
            if not job_data:
                state.message = 'Job data not found'
                return state
            
            source_video = job_data.get('current_video_path')
            
            if not source_video:
                state.message = 'Source video not found'
                return state
            
            # Use edit_instructions if available (smart merge), otherwise use time_ranges_to_delete (cuts)
            if state.edit_instructions:
                # Smart merge: use pre-built edit_instructions with 'keep' type
                edit_instructions = [inst.model_dump() for inst in state.edit_instructions]
            elif state.time_ranges_to_delete:
                # Regular edits: convert time_ranges_to_delete to 'cut' instructions
                edit_instructions = [
                    {'type': 'cut', 'start': start, 'end': end}
                    for start, end in state.time_ranges_to_delete
                ]
            else:
                state.message = 'No edits to perform'
                return state
            
            payload = {
                'edit_instructions': edit_instructions,
                'source_video': source_video
            }
            
            response = await client.post(
                f'{mcp_server_url}/tool/render_timeline',
                json=payload,
                timeout=300
            )
            
            if response.status_code == 200:
                result = response.json()
                state.result_video_path = result.get('data', {}).get('output_path')
                state.message = 'Video rendered successfully'
            else:
                state.message = f'MCP tool failed: {response.text}'
        
        except Exception as e:
            state.message = f'Error calling MCP tools: {str(e)}'
    
    return state

async def update_state(state: AgentState) -> AgentState:
    """
    Save updated state and regenerate transcript if needed.
    Gracefully handles transcription failures by updating job status with a warning.
    """
    import httpx
    
    state_manager = StateManager(TRANSCRIPTS_DIR)
    
    try:
        await state_manager.save_agent_state(state.job_id, state)
        
        if state.result_video_path:
            job_data = await state_manager.load_job(state.job_id)
            if job_data:
                job_data['current_video_path'] = state.result_video_path
                await state_manager.save_job(state.job_id, job_data)
            
            mcp_server_url = os.getenv('MCP_SERVER_URL', 'http://localhost:9000')
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f'{mcp_server_url}/tool/generate_transcript',
                        json={'video_path': state.result_video_path},
                        timeout=180
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        transcript_data = result.get('data', {})

                        words_data = transcript_data.get('words', [])
                        new_transcript = words_to_transcript(
                            words=words_data,
                            text=transcript_data.get('text', ''),
                            duration=transcript_data.get('duration', 0.0)
                        )

                        state.result_transcript = extract_words_from_transcript(new_transcript)
                        await state_manager.save_transcript(state.job_id, new_transcript)
                        state.message = 'Video edited and transcript regenerated successfully'
                    else:
                        state.message = 'Video edited successfully, but transcript regeneration failed. Script-based editing will be updated on next edit.'
                        logger.warning(f"Transcription regeneration failed for job {state.job_id}")
                        
            except Exception as e:
                state.message = 'Video edited successfully, but transcript regeneration failed. Script-based editing will be updated on next edit.'
                logger.warning(f"Transcription regeneration error for job {state.job_id}: {str(e)}")
    
    except Exception as e:
        state.message = f'Error updating state: {str(e)}'
        logger.error(f"State update error for job {state.job_id}: {str(e)}")
    
    return state

async def determine_smart_merge(state: AgentState) -> AgentState:
    """
    Smart merge: Analyze transcript and determine which segments to KEEP and reorder.
    Reuses the same pattern as determine_edits but outputs 'keep' instructions.
    """
    try:
        # Load full transcript (hierarchical)
        transcript = await state_manager.load_transcript(state.job_id)
        
        if not transcript or not transcript.clips:
            state.message = 'No transcript available for smart merge'
            logger.warning(f"No transcript found for smart merge job {state.job_id}")
            return state
        
        # Detect or load creator context
        try:
            # Try to load existing context first
            context = await state_manager.load_context(state.job_id)
            if not context:
                # Detect context from transcript
                context = await detect_creator_context(transcript.text or "")
                if context:
                    await state_manager.save_context(state.job_id, context)
        except Exception as e:
            logger.warning(f"Context detection failed for job {state.job_id}: {e}, using defaults")
            context = CreatorContext(
                industry="general",
                role="creator",
                target_audience="general audience",
                tone="professional",
                suggested_hook_style="results-driven"
            )
        
        # Use existing smart merge logic
        merge_result = await analyze_and_reorder_segments(transcript, context)
        segments = merge_result.get("segments", [])
        
        if not segments:
            state.message = 'Smart merge produced no segments'
            logger.warning(f"Smart merge produced no segments for job {state.job_id}")
            return state
        
        # Convert SmartMergeSegment to EditInstruction with type='keep'
        state.edit_instructions = [
            EditInstruction(
                type='keep',
                start=seg.start,
                end=seg.end
            )
            for seg in segments
        ]
        
        state.message = merge_result.get('reasoning', 'Smart merge completed')
        logger.info(f"Smart merge: {len(segments)} segments to keep for job {state.job_id}")
        
    except Exception as e:
        state.message = f'Error in smart merge: {str(e)}'
        logger.error(f"Smart merge error for job {state.job_id}: {e}", exc_info=True)
    
    return state

def create_agent_graph() -> Any:
    """
    Create the LangGraph agent workflow.
    """
    workflow = StateGraph(AgentState)
    
    workflow.add_node("analyze_query", analyze_query)
    workflow.add_node("fetch_transcript", lambda s: asyncio.run(fetch_transcript(s)))
    workflow.add_node("determine_edits", determine_edits)
    workflow.add_node("execute_edits", lambda s: asyncio.run(call_mcp_tools(s)))
    workflow.add_node("update_state", lambda s: asyncio.run(update_state(s)))
    
    workflow.set_entry_point("analyze_query")
    workflow.add_edge("analyze_query", "fetch_transcript")
    workflow.add_edge("fetch_transcript", "determine_edits")
    workflow.add_edge("determine_edits", "execute_edits")
    workflow.add_edge("execute_edits", "update_state")
    workflow.add_edge("update_state", END)
    
    return workflow.compile()

agent = create_agent_graph()

def create_smart_merge_graph() -> Any:
    """
    Create the LangGraph workflow for smart merge.
    Reuses existing infrastructure from agent.py:
    - fetch_transcript: Load transcript
    - determine_smart_merge: Analyze and reorder segments
    - call_mcp_tools: Render video (now supports 'keep' instructions)
    - update_state: Save state and regenerate transcript
    """
    workflow = StateGraph(AgentState)
    
    # Reuse existing nodes
    workflow.add_node("fetch_transcript", lambda s: asyncio.run(fetch_transcript(s)))
    
    # New node for smart merge analysis
    workflow.add_node("determine_smart_merge", lambda s: asyncio.run(determine_smart_merge(s)))
    
    # Reuse existing MCP and state nodes
    workflow.add_node("execute_edits", lambda s: asyncio.run(call_mcp_tools(s)))
    workflow.add_node("update_state", lambda s: asyncio.run(update_state(s)))
    
    workflow.set_entry_point("fetch_transcript")
    workflow.add_edge("fetch_transcript", "determine_smart_merge")
    workflow.add_edge("determine_smart_merge", "execute_edits")
    workflow.add_edge("execute_edits", "update_state")
    workflow.add_edge("update_state", END)
    
    return workflow.compile()

smart_merge_agent = create_smart_merge_graph()

async def run_agent(job_id: str, query: str, current_video_path: str) -> Dict[str, Any]:
    """
    Run the agent for a specific job.
    
    Returns:
        Dict with keys:
        - video_path: str - Path to the edited video
        - transcript_words: List[Word] - Updated transcript words
        - message: str - Status message
    """
    initial_state = AgentState(
        job_id=job_id,
        user_query=query,
        current_video_path=current_video_path
    )
    
    result_state = await agent.ainvoke(initial_state)
    
    return {
        'video_path': result_state.get('result_video_path') or current_video_path,
        'transcript_words': result_state.get('result_transcript') or [],
        'message': result_state.get('message', '')
    }

async def run_smart_merge(job_id: str, current_video_path: str) -> Dict[str, Any]:
    """
    Run the smart merge workflow for a specific job.
    Reuses the same infrastructure as run_agent but with smart merge logic.
    
    Returns:
        Dict with keys:
        - video_path: str - Path to the merged video
        - transcript_words: List[Word] - Updated transcript words
        - message: str - Status message
    """
    initial_state = AgentState(
        job_id=job_id,
        user_query="smart_merge",  # Placeholder, not used in smart merge
        current_video_path=current_video_path
    )
    
    result_state = await smart_merge_agent.ainvoke(initial_state)
    
    return {
        'video_path': result_state.get('result_video_path') or current_video_path,
        'transcript_words': result_state.get('result_transcript') or [],
        'message': result_state.get('message', '')
    }