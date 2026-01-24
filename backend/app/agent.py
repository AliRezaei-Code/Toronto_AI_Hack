import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.models import AgentState, Word, EditInstruction, Transcript
from app.state_manager import StateManager

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SHARED_DATA_DIR = os.getenv(
    'SHARED_DATA_DIR',
    os.path.join(os.path.dirname(__file__), '..', '..', 'shared-data')
)
TRANSCRIPTS_DIR = os.path.join(SHARED_DATA_DIR, 'transcripts')

os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)

state_manager = StateManager(TRANSCRIPTS_DIR)

llm = ChatOpenAI(
    model='gpt-4o',
    temperature=0.3,
    api_key=OPENAI_API_KEY
)

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
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=query)
        ])
        
        result_text = response.content.strip()
        
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

def fetch_transcript(state: AgentState) -> AgentState:
    """
    Fetch current transcript for the job.
    """
    try:
        transcript = asyncio.run(state_manager.load_transcript(state.job_id))
        
        if transcript and transcript.words:
            state.current_transcript = transcript.words
        else:
            state.message = 'No transcript found for this job'
    
    except Exception as e:
        state.message = f'Error fetching transcript: {str(e)}'
    
    return state

def determine_edits(state: AgentState) -> AgentState:
    """
    Use GPT-4o to determine word indices/time ranges to edit.
    """
    if not state.current_transcript:
        state.message = 'No transcript available to determine edits'
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
        ])
        
        result_text = response.content.strip()
        
        if result_text.startswith('```json'):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith('```'):
            result_text = result_text[3:-3].strip()
        
        analysis = json.loads(result_text)
        
        word_indices = analysis.get('words_to_delete', [])
        time_ranges = analysis.get('time_ranges_to_delete', [])
        
        state.time_ranges_to_delete = [(r[0], r[1]) for r in time_ranges]
        state.message = analysis.get('reasoning', f'Determined {len(word_indices)} words to remove')
        
    except Exception as e:
        state.message = f'Error determining edits: {str(e)}'
    
    return state

async def call_mcp_tools(state: AgentState) -> AgentState:
    """
    Call MCP server tools to perform the edits.
    """
    import httpx
    
    if not state.time_ranges_to_delete:
        state.message = 'No edits to perform'
        return state
    
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
            
            edit_instructions = []
            
            for start, end in state.time_ranges_to_delete:
                edit_instructions.append({
                    'type': 'cut',
                    'start': start,
                    'end': end
                })
            
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
    """
    import httpx
    
    state_manager = StateManager(TRANSCRIPTS_DIR)
    
    try:
        await state_manager.save_agent_state(state.job_id, state)
        
        if state.result_video_path:
            mcp_server_url = os.getenv('MCP_SERVER_URL', 'http://localhost:9000')
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'{mcp_server_url}/tool/generate_transcript',
                    json={'video_path': state.result_video_path},
                    timeout=180
                )
                
                if response.status_code == 200:
                    result = response.json()
                    transcript_data = result.get('data', {})
                    
                    new_transcript = Transcript(
                        text=transcript_data.get('text'),
                        words=[Word(**w) for w in transcript_data.get('words', [])],
                        duration=transcript_data.get('duration')
                    )
                    
                    state.result_transcript = new_transcript.words
                    await state_manager.save_transcript(state.job_id, new_transcript)
                    state.message = 'Transcript regenerated successfully'
            
            job_data = await state_manager.load_job(state.job_id)
            if job_data:
                job_data['current_video_path'] = state.result_video_path
                await state_manager.save_job(state.job_id, job_data)
    
    except Exception as e:
        state.message = f'Error updating state: {str(e)}'
    
    return state

def create_agent_graph():
    """
    Create the LangGraph agent workflow.
    """
    workflow = StateGraph(AgentState)
    
    workflow.add_node("analyze_query", analyze_query)
    workflow.add_node("fetch_transcript", fetch_transcript)
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

async def run_agent(job_id: str, query: str, current_video_path: str):
    """
    Run the agent for a specific job.
    """
    initial_state = AgentState(
        job_id=job_id,
        user_query=query,
        current_video_path=current_video_path
    )
    
    result_state = await agent.ainvoke(initial_state)
    
    return {
        'video_path': result_state.result_video_path or current_video_path,
        'transcript_words': result_state.result_transcript or [],
        'message': result_state.message
    }