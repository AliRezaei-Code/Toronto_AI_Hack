- Agent mcp tells the users what  tools are avaialbe to them and it suggests users stuff (agent prmompts the user not the other way around )
-it suggests changes based on the SOTA best pracrticdes in short form cvontent retention editing from a json databse 
- 

## Mermaid diagram (improved)

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 60, "rankSpacing": 80}}}%%
flowchart LR
    A[Android App] -->|upload media| S[Object Storage]
    A -->|write metadata| D[MongoDB]
    A -->|request guidance| M[Assembly Agent MCP Orchestrator]

    M -->|list tools| R[Tool Registry]
    M -->|best practices| C[Retention Editing Corpus JSON]

    M -->|invoke edits| F[Editing MCPs FFmpeg Premiere]
    M -->|invoke comps| E[After Effects MCP]

    F -->|edited assets| S
    E -->|renders| S

    S -->|asset refs| M
    D -->|metadata| M

    M -->|suggestions and diffs| A
```

## PRD (Product Requirements Document)

### 1) Overview
Build an Agent MCP that proactively guides users through short-form content editing by surfacing available tools, recommending SOTA best-practice edits, and maximizing viewer retention based on a JSON knowledge base.

### 2) Goals
- Increase retention metrics for short-form scripts.
- Reduce time-to-publish by providing concise, actionable edits.
- Make tool discovery effortless via proactive prompts.

### 3) Non-goals
- Full long-form editing or enterprise CMS integration.
- Automatic publishing without user review.
- Video asset creation beyond edits/composites.

### 4) Users
- Content creators and editors focused on short-form videos.
- Social media managers optimizing scripts quickly.

### 5) User stories
- As a creator, I want the agent to tell me what tools it can use so I know what's possible.
- As an editor, I want concise, SOTA-based edit suggestions to improve retention.
- As a user, I want to accept or reject suggestions quickly and keep control.

### 6) Functional requirements
- Tool discovery: Agent lists available tools and suggests when to use them.
- Knowledge retrieval: Load best-practice patterns from a JSON database.
- Suggestion engine: Generate short-form edit suggestions (hooks, pacing, clarity).
- Diff presentation: Show suggested edits in a compact, actionable format.
- Feedback loop: Capture accept/reject feedback to improve future suggestions.

### 7) Non-functional requirements
- Latency: < 2s for initial suggestions on typical scripts.
- Reliability: 99% uptime for suggestion service.
- Privacy: User drafts are not stored without explicit opt-in.

### 8) Data sources
- JSON database containing best practices, patterns, and examples.
- Optional user-provided style guide JSON.

### 9) UX notes
- Proactive prompt: "I can help with X, Y, Z. Want suggestions?"
- Suggestions grouped by intent: Hook, Pacing, Clarity, CTA.
- One-click apply/reject for each suggestion.

### 10) Success metrics
- % suggestions accepted per session.
- Time-to-publish reduction.
- Retention uplift in downstream analytics (if connected).

### 11) Milestones (MVP)
1. Basic tool discovery + static JSON best-practice retrieval.
2. Suggestion generation + UI diff display.
3. Feedback capture and metrics dashboard.

### 12) Open questions
- What is the schema of the JSON best-practices database?
- Which platforms/retention metrics are considered "success"?
- test content https://drive.google.com/drive/folders/1ptJdoCLkHCmZnNUHn_5sIVc5FfTEGWQF?referrer=luma
https://github.com/hetpatel-11/Adobe_Premiere_Pro_MCP
https://mcpservers.org/servers/video-db/agent-toolkit
https://mcpservers.org/servers/TSavo/creatify-mcp
https://github.com/video-creator/ffmpeg-mcp
