# Agent Instructions for LLM Knowledge Base

This document provides instructions for AI agents on how to effectively use the LLM Knowledge Base for video production, retention editing, and YouTube SEO optimization.

## Purpose

The LLM Knowledge Base is structured to enable AI agents to:

- Provide actionable, specific advice for content creation
- Generate well-informed scripts and editing plans
- Optimize metadata for YouTube algorithm success
- Choose appropriate tools and workflows for specific projects
- Apply retention engineering principles consistently

## Knowledge Base Structure

The knowledge base is organized into 8 categories:

```
01_core_concepts/     - Psychological foundations (retention, dopamine, pattern interrupts)
02_scripting/         - Script formats, narrative techniques, visual cue planning
03_visual_editing/    - Visual techniques (kinetic type, spatial dynamics, transitions, pacing)
04_audio_design/      - Sound architecture (layers, music stems, mixing)
05_seo_metadata/      - YouTube optimization (titles, descriptions, technical, compliance)
06_style_guides/      - Creator style references (MrBeast, Vox, Lemmino, Hormozi)
07_tools_workflows/   - Software comparison and workflow templates
08_checklists/        - Actionable implementation checklists
```

## Agent Usage Guidelines

### 1. Cross-Reference Dependencies

Each JSON file includes a `dependencies` array in the `meta` section. Always load related files to provide comprehensive advice:

```
Example: When asked about kinetic typography (kinetic_typography.json):
- Also load: pattern_interrupts.json, visual_cues.json (dependencies)
- Result: Advice includes both the technique and its strategic application
```

### 2. Context-Aware Recommendations

Before providing advice, determine the user's context:

- **Content type**: Tutorial, documentary, entertainment, vlog, short-form
- **Audience**: Younger/mature viewers, educational/entertainment
- **Platform**: YouTube (long-form), YouTube Shorts, TikTok, Instagram Reels
- **Production level**: Beginner, intermediate, professional

Use context to prioritize which techniques and tools to recommend.

### 3. Prioritized Information Access

Within each JSON file, use this priority order for information retrieval:

1. **Summary**: Quick understanding of what the file contains
2. **Core Principles**: High-level, must-understand concepts
3. **Techniques Array**: Specific, actionable implementations with timing and examples
4. **Data Structures**: Configuration parameters and reference data
5. **References**: Source material for deeper context

### 4. Technique Selection Framework

When recommending techniques from the `techniques` array, consider:

- **Implementation requirements**: Tools and skills needed
- **Pros/Cons**: Practical considerations for the user's situation
- **Timing**: When and how frequently to apply
- **Examples**: Concrete use cases matching user's content
- **Compatibility**: Does it work with other recommended techniques?

### 5. Workflow Integration

When users need end-to-end guidance:

1. Start with `workflow_templates.json` for overall process
2. Pull relevant `checklists` for verification steps
3. Reference specific `techniques` from category files for detailed steps
4. Use `software_comparison.json` to match tools to user's level and needs
5. Check `style_guides/` for aesthetic direction if applicable

### 6. Style Selection Guidance

Use `style_guides/` files appropriately:

- **MrBeast style**: Younger audiences, entertainment challenge
- **Vox style**: Explainer content, educational documentary
- **Lemmino style**: Mystery-driven narrative, atmospheric
- **Never copy blindly**: Adapt elements to user's content and voice

### 7. Checkpoint Verification

For implementation tasks, reference `checklists/` files:

- Use `retention_checklist.json` for editing and content optimization
- Use `seo_checklist.json` for publication metadata
- Present as actionable verification steps, not generic advice

### 8. Tool Recommendations

When suggesting software:

- Consider user's production level and timeline
- Balance free vs. paid tools based on need
- Explain integration between tools (NLE + After Effects Dynamic Link)
- Reference `software_comparison.json` for trade-offs

### 9. Common Query Types and Response Patterns

#### Scripting Queries

```
User: "Help me write a script for..."
Response:
1. Recommend AV script format with visual cue guidance
2. Suggest relevant narrative techniques (open loops, context switches)
3. Identify visual change points and B-roll opportunities
4. Hook structure recommendation based on content type
```

#### Editing Queries

```
User: "How do I edit this for retention?"
Response:
1. Assess pacing needs based on content type
2. Recommend visual change frequency (3-5s rule)
3. Suggest specific techniques (dynamic zoom, b-roll, cuts)
4. Provide audio design guidance
5. Reference style guide if applicable direction needed
```

#### SEO Queries

```
User: "Optimize my video for YouTube"
Response:
1. Title optimization with formulas and power words
2. Mini-blog description structure
3. Technical metadata (captions, timestamps, tags)
4. Compliance warnings (no deceptive practices)
5. Checklist verification before publish
```

#### Tool Selection

```
User: "What software should I use?"
Response:
1. Assess content type and production level
2. Primary NLE recommendation with justification
3. Secondary tools for specific needs (motion graphics, color)
4. Workflow efficiency considerations
```

### 10. Avoid These Pitfalls

- **Generic advice**: Always be specific to the user's content and context
- **Overloading**: Prioritize 3-5 key recommendations, not everything available
- **Tool-centric**: Focus on outcomes, not just recommending specific tools
- **Style copying**: Use style guides as reference, not templates to duplicate
- **Ignoring dependencies**: Always check and load related knowledge base files
- **Missing verification**: Include checklist elements for complex tasks

## Example Agent Response Pattern

```yaml
Query: "How do I make an educational video about coffee brewing?"

Context Determination:
- Content type: Educational tutorial
- Audience: Likely beginners (coffee newcomers)
- Format: Long-form YouTube
- Tone: Informative, engaging

Knowledge Base Access:
1. scripting/narrative_techniques.json (open loops, structure)
2. scripting/visual_cues.json (B-roll planning for brewing steps)
3. visual_editing/pacing_rhythm.json (hold frames for instruction)
4. visual_editing/kinetic_typography.json (highlight key parameters)
5. audio_design/sound_layers.json (sound design for ASMR appeal)
6. seo_metadata/title_optimization.json (educational formulas)

Structured Response:
1. Script structure with step-by-step brewing process
2. B-roll plan: beans, grinder, bloom, pour, final cup
3. Pacing: hold frames on technique demonstrations
4. Visual: bold typography for key temperatures/times
5. Audio: ambient sounds (grinding, pouring) for immersion
6. Title: "Perfect Pour: Coffee Brewing Guide for Beginners | Never Burn Beans Again"
7. Thumbnail: Side-by-side comparison of over-extracted vs. perfect pour

Checklist verification points for success
```

## File Loading Strategy

When answering queries, use this loading priority:

```
1. Direct relevance: Load files that directly address the query topic
2. Dependencies: Load all dependencies from loaded files
3. Context needs: Load additional files that provide context
4. Style reference: Load style guide if aesthetic direction needed
5. Workflow/checklist: Load for implementation guidance
```

## Quality Standards

Agent responses should be:

- **Specific**: Include concrete examples, not theoretical concepts
- **Actionable**: Steps the user can take immediately
- **Contextual**: Tailored to their content type and situation
- **Cross-referenced**: When related concepts are involved, mention them
- **Verifiable**: Include metrics or checkpoints where applicable

## Continuous Improvement

Track which knowledge base sections are most useful for different query types. Consider referencing success metrics (retention benchmarks, CTR targets) when discussing techniques to provide realistic expectations.

---

_This agent.md file should be read first when initializing any agent that will use this LLM Knowledge Base._
