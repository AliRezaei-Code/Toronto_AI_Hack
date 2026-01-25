# Video Copilot - Product Requirements Document

## Executive Summary

**Product Name:** Video Copilot  
**Tagline:** Record once, demo forever  
**Type:** Desktop application for automated demo video production  
**Target Users:** Hackathon participants, indie hackers, product managers, developers  
**Development Timeline:** 24 hours (Cerebras + Cline Hackathon)

---

## Problem Statement

Creating compelling demo videos for hackathons, product launches, or presentations is painful and time-consuming:

1. **Time-Consuming:** Recording a 30-minute demo requires 2-4 hours of manual editing
2. **Technical Complexity:** Requires knowledge of video editing software (Premiere, Final Cut, etc.)
3. **Inconsistent Quality:** Manual editing leads to varying quality across demos
4. **Platform Optimization:** Different platforms (Twitter, Discord, YouTube) require different formats
5. **Last-Minute Rush:** Hackathon submissions often happen under extreme time pressure

---

## Solution Overview

Video Copilot is a desktop application that:

- Uploads existing video files for processing
- Automatically transcribes audio using Deepgram
- Provides comprehensive AI-powered retention analysis
- Generates actionable insights for content improvement
- Optimizes video metadata for platform discovery

**Key Differentiator:** Pure analysis-focused platform that transforms raw videos into engagement-optimized content through advanced LLM analysis of text, audio, and visual elements, without any video processing or editing.

---

## Technical Architecture

### Tech Stack

**Frontend:**

- Next.js 14 (App Router) with TypeScript
- shadcn/ui for component library
- Tailwind CSS for styling
- React Query for state management

**Desktop Wrapper:**

- Electron (cross-platform: macOS, Windows, Linux)
- electron-builder for packaging

**Backend Services:**

- Node.js + Express for API
- Web Audio API for audio analysis
- AI service integrations (Deepgram, Gemini, YouTube)

**Core Libraries:**

- `react-player` - Video playback
- `wavesurfer.js` - Audio waveform visualization
- `date-fns` - Time manipulation
- `@deepgram/sdk` - Audio transcription API (Nova-2 model)
- `@google/generative-ai` - Gemini Multimodal API with multiple model support (gemini-3-flash-latest, gemini-2.5-flash, gemini-3-pro-latest)
- `googleapis` - YouTube Data API v3
- `@tensorflow/tfjs` - Audio analysis and pattern recognition
- `canvas` - Frame extraction and visual analysis

---

## Core Features

### 1. Video Upload Module

**User Stories:**

- As a user, I want to upload existing video files for processing
- As a user, I want to see video preview and metadata before processing
- As a user, I want to support multiple video formats (MP4, MOV, AVI, WebM)
- As a user, I want to see upload progress and estimated processing time

**Technical Requirements:**

- [ ] Implement video file upload with drag-and-drop interface
- [ ] Add video format validation and conversion
- [ ] Create video metadata extraction (duration, resolution, codec)
- [ ] Implement upload progress tracking
- [ ] Add video preview player
- [ ] Support for large files (>2GB) with chunked upload

**Acceptance Criteria:**

- Upload starts within 1 second of file selection
- Video preview loads within 3 seconds
- Support for all common video formats
- Upload progress updates every 0.5 seconds

---

### 2. Advanced Retention Analysis Engine

**User Stories:**

- As a user, I want comprehensive retention analysis of my video content
- As a user, I want AI to identify suspense and curiosity-building moments
- As a user, I want an overview of video engagement potential
- As a user, I want LLM analysis of text, audio, and visual content
- As a user, I want actionable suggestions to improve viewer retention

**Technical Requirements:**

- [ ] Implement comprehensive content analysis using Gemini Multimodal
- [ ] Create suspense detection algorithm analyzing audio patterns and speech content
- [ ] Build curiosity scoring based on content structure and visual elements
- [ ] Implement audio analysis for emotional tone and engagement indicators
- [ ] Create visual analysis for scene changes, facial expressions, and action intensity
- [ ] Build LLM-powered content quality assessment
- [ ] Generate retention heatmap with engagement predictions
- [ ] Create comprehensive video overview with key insights
- [ ] Implement comparative analysis against successful video patterns

**Acceptance Criteria:**

- Retention analysis completes within 3 minutes for 15-minute video
- Suspense detection accuracy > 85% based on user feedback
- Engagement predictions correlate with actual viewer behavior > 70%
- Analysis covers text, audio, and visual elements comprehensively

---

### 3. Content Analysis Engine

**User Stories:**

- As a user, I want the app to automatically detect when I'm speaking
- As a user, I want the app to identify different sections of my video
- As a user, I want to see a visual timeline of my video with insights
- As a user, I want to manually adjust chapter markers if needed

**Technical Requirements:**

- [ ] Implement silence detection algorithm (threshold: -40dB, min duration: 2s)
- [ ] Detect content changes using AI analysis
- [ ] Analyze audio intensity to identify active periods
- [ ] Generate chapter markers based on content changes and retention analysis
- [ ] Create timeline data structure with segments
- [ ] Build timeline visualization component
- [ ] Allow manual adjustment of chapter markers
- [ ] Export timeline as JSON for debugging

**Acceptance Criteria:**

- Silence detection accuracy > 90%
- Chapter markers align with natural content transitions and retention insights
- Timeline renders smoothly with 1000+ segments
- Manual adjustments persist through export

---

### 4. AI-Powered Insights Engine

**User Stories:**

- As a user, I want automatic transcription of my video content
- As a user, I want AI analysis of video retention and engagement with suspense detection
- As a user, I want comprehensive LLM analysis of text, audio, and visual content
- As a user, I want intelligent suggestions for improving my demo based on retention insights
- As a user, I want automatic SEO optimization for YouTube uploads
- As a user, I want AI-generated thumbnails for my videos

**Technical Requirements:**

- [ ] Integrate Deepgram API for audio transcription
- [ ] Implement Gemini Multimodal (Flash 3 or Pro 3) for comprehensive video analysis
- [ ] Create advanced retention analysis dashboard with suspense and curiosity metrics
- [ ] Build intelligent insights interface with AI suggestions based on retention data
- [ ] Implement comprehensive content analysis (text, audio, visual) using LLM
- [ ] Add script improvement suggestions based on content and retention analysis
- [ ] Create visual enhancement recommendations
- [ ] Integrate YouTube Data API v3 for SEO optimization
- [ ] Generate SEO-optimized titles, descriptions, and tags
- [ ] Implement automatic chapter generation for YouTube
- [ ] Add thumbnail generation using Gemini Nano

**Acceptance Criteria:**

- Transcription accuracy > 95% for clear audio
- AI analysis completes within 3 minutes for 15-minute video
- Retention analysis identifies suspense and curiosity moments with > 80% accuracy
- LLM content analysis provides actionable insights for all three modalities
- SEO suggestions improve video discoverability
- Thumbnail generation produces visually appealing results

---

### 5. User Interface

**User Stories:**

- As a user, I want a clean, intuitive interface
- As a user, I want keyboard shortcuts for common actions
- As a user, I want to see my recent video uploads
- As a user, I want easy access to retention analysis and AI insights

**Technical Requirements:**

- [ ] Design main application window with three views:
  - Upload view (drag-and-drop, preview, metadata)
  - Analysis view (timeline, retention heatmap, AI insights)
  - Insights view (transcription, SEO, suggestions)
- [ ] Implement navigation between views
- [ ] Add keyboard shortcuts:
  - `Cmd/Ctrl + U` - Upload video
  - `Cmd/Ctrl + A` - AI Analysis
  - `Cmd/Ctrl + ,` - Settings
- [ ] Create settings panel for:
  - AI analysis preferences (analysis length, model selection)
  - Retention analysis settings (suspense sensitivity, curiosity thresholds)
  - API key management (Deepgram, Gemini, YouTube)
  - Theme selection (light/dark)
- [ ] Build recent uploads list with thumbnails and retention scores
- [ ] Add project management (save/load projects)
- [ ] Implement undo/redo for timeline edits

**Acceptance Criteria:**

- All views load within 1 second
- Keyboard shortcuts work consistently
- UI is responsive on 13" laptop screens
- Dark mode is default (better for video work)

---

## Implementation Tasks

### Phase 1: Project Setup (Hours 1-2)

**Backend Setup:**

- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Electron main process
- [ ] Configure Electron preload scripts
- [ ] Set up Express server for API
- [ ] Install and configure FFmpeg binaries
- [ ] Set up project structure (folders, configs)

**Frontend Setup:**

- [ ] Install shadcn/ui components
- [ ] Configure Tailwind CSS
- [ ] Set up React Query
- [ ] Create base layout components
- [ ] Set up routing (upload, timeline, ai-analysis, export)
- [ ] Configure TypeScript paths

**Development Environment:**

- [ ] Set up ESLint and Prettier
- [ ] Configure Git hooks (husky, lint-staged)
- [ ] Set up development scripts
- [ ] Create environment variable templates
- [ ] Set up logging system

---

### Phase 2: Video Upload Module (Hours 3-4)

**File Upload System:**

- [ ] Implement drag-and-drop file upload
- [ ] Add video format validation
- [ ] Create metadata extraction
- [ ] Implement chunked upload for large files
- [ ] Add upload progress tracking
- [ ] Create video preview player

**Upload UI:**

- [ ] Build upload interface with drag-and-drop
- [ ] Add file validation feedback
- [ ] Create metadata display panel
- [ ] Implement progress indicators
- [ ] Add upload settings panel

**File Management:**

- [ ] Implement temporary file storage
- [ ] Add file naming convention
- [ ] Create video metadata storage
- [ ] Implement cleanup of old uploads

---

### Phase 3: Advanced Retention Analysis (Hours 5-7)

**Audio Analysis:**

- [ ] Implement silence detection algorithm
- [ ] Create audio waveform visualization
- [ ] Add speech detection
- [ ] Implement audio level analysis
- [ ] Create audio segment classification

**Comprehensive Content Analysis:**

- [ ] Implement Deepgram transcription pipeline
- [ ] Create Gemini Multimodal integration for video analysis
- [ ] Build suspense detection algorithm (audio patterns + content analysis)
- [ ] Develop curiosity scoring system
- [ ] Implement emotional tone analysis
- [ ] Create visual scene analysis
- [ ] Build LLM-powered content quality assessment
- [ ] Generate retention heatmap with predictions
- [ ] Create comprehensive video overview

**Retention Analysis UI:**

- [ ] Build retention analysis dashboard
- [ ] Create suspense and curiosity visualization
- [ ] Add engagement prediction charts
- [ ] Implement content quality scores
- [ ] Create comparative analysis views
- [ ] Add actionable insights panel

**Timeline Integration:**

- [ ] Build timeline component with retention overlay
- [ ] Add chapter marker display with AI insights
- [ ] Implement segment highlighting based on retention
- [ ] Create zoom/pan controls for detailed analysis
- [ ] Add time ruler with engagement metrics
- [ ] Implement segment selection with AI suggestions

---

### Phase 4: Content Analysis Engine (Hours 8-9)

**Timeline Processing:**

- [ ] Implement silence detection algorithm
- [ ] Create content change detection using AI analysis
- [ ] Add audio intensity analysis
- [ ] Generate chapter markers based on content and retention
- [ ] Create timeline data structure with segments
- [ ] Build timeline visualization component
- [ ] Allow manual adjustment of chapter markers
- [ ] Export timeline as JSON for debugging

**Timeline Editing:**

- [ ] Add chapter marker drag-and-drop
- [ ] Implement segment splitting
- [ ] Add segment merging
- [ ] Create undo/redo system
- [ ] Implement timeline export/import
- [ ] Add AI-suggested insight indicators

---

### Phase 5: AI Integration (Hours 10-12)

### Phase 6: UI Development (Hours 13-15)

**Main Interface:**

- [ ] Build application shell
- [ ] Create navigation component
- [ ] Implement view switching
- [ ] Add status bar
- [ ] Create menu bar

**Upload View:**

- [ ] Build upload interface with drag-and-drop
- [ ] Add video preview and metadata display
- [ ] Create upload progress indicators
- [ ] Implement upload settings panel
- [ ] Add recent uploads list

**Analysis View:**

- [ ] Build timeline editor with retention overlay
- [ ] Add chapter controls with AI insights
- [ ] Create segment inspector with engagement metrics
- [ ] Implement playback controls
- [ ] Add retention heatmap visualization

**Insights View:**

- [ ] Build comprehensive transcription display with timeline sync
- [ ] Create advanced retention analysis dashboard with suspense/curiosity metrics
- [ ] Add intelligent suggestions interface with actionable items
- [ ] Implement enhanced SEO optimization interface
- [ ] Create advanced thumbnail generation and selection

**Settings View:**

- [ ] Build AI service configuration
- [ ] Create analysis settings
- [ ] Add retention analysis preferences
- [ ] Implement keyboard shortcut editor
- [ ] Add theme selection
- [ ] Create about page

---

### Phase 7: Polish & Testing (Hours 16-18)

**Performance Optimization:**

- [ ] Implement video caching for large files
- [ ] Add lazy loading for uploads and analysis results
- [ ] Optimize timeline rendering with retention overlays
- [ ] Reduce memory usage during AI processing
- [ ] Optimize AI service API calls

**Error Handling:**

- [ ] Add comprehensive error logging for AI services
- [ ] Implement graceful error recovery for API failures
- [ ] Create user-friendly error messages
- [ ] Add crash reporting
- [ ] Implement backup/restore

**Testing:**

- [ ] Test upload on different video formats and sizes
- [ ] Test with various audio qualities
- [ ] Test with long recordings (30+ minutes)
- [ ] Test AI services integration (Deepgram, Gemini, YouTube)
- [ ] Test transcription accuracy across different audio types
- [ ] Test retention analysis and suspense detection
- [ ] Test SEO optimization features
- [ ] Test on different OS (macOS, Windows)
- [ ] Performance testing with AI processing

**Documentation:**

- [ ] Write user guide with AI features
- [ ] Create API documentation
- [ ] Write developer documentation
- [ ] Create troubleshooting guide for AI services
- [ ] Add inline code comments

---

### Phase 8: Demo & Submission (Hours 19-21)

**Demo Creation:**

- [ ] Create demo videos showcasing AI features
- [ ] Use Video Copilot to analyze demo videos
- [ ] Create demo script highlighting retention analysis
- [ ] Record voiceover explaining AI capabilities

**Submission Preparation:**

- [ ] Write project description emphasizing AI innovations
- [ ] Create GitHub repository
- [ ] Write README with setup instructions
- [ ] Create screenshots of AI features
- [ ] Document AI services usage (Deepgram, Gemini, YouTube API)
- [ ] Prepare submission post with demo results

**Final Polish:**

- [ ] Fix any remaining bugs
- [ ] Optimize for performance
- [ ] Add final UI touches
- [ ] Prepare for Q&A about AI features

---

## Success Metrics

### Technical Metrics

- [ ] Upload starts within 1 second of file selection
- [ ] Timeline analysis completes within 30 seconds
- [ ] AI transcription completes within 3 minutes for 15-minute video
- [ ] Advanced retention analysis completes within 5 minutes
- [ ] Suspense detection accuracy > 80%
- [ ] Application uses < 500MB RAM
- [ ] Application size < 200MB

### User Experience Metrics

- [ ] User can upload and process first video in < 5 minutes
- [ ] User can complete full workflow (upload → AI analysis → insights) in < 20 minutes
- [ ] User satisfaction score > 4/5
- [ ] Transcription accuracy > 95%
- [ ] AI suggestions improve video engagement by > 25%
- [ ] Retention analysis provides actionable insights > 90% of the time
- [ ] Suspense detection helps users identify key moments > 85% accuracy
- [ ] Zero critical bugs in submission

### Hackathon Metrics

- [ ] Demo video < 2 minutes
- [ ] Submission includes comprehensive AI services usage documentation
- [ ] GitHub repo is well-documented
- [ ] Application is fully functional (no "imagine if" features)
- [ ] AI features are working and demonstrable
- [ ] Retention analysis and suspense detection are showcased in demo
- [ ] LLM multimodal analysis capabilities are clearly demonstrated

---

## Risk Assessment

### Technical Risks

**Risk:** AI service integration complexity

- **Mitigation:** Start with one service (Deepgram), add others incrementally, implement robust error handling
- **Backup Plan:** Use mock AI responses for demo, focus on core analysis functionality

**Risk:** Cross-platform compatibility issues

- **Mitigation:** Test on macOS and Windows early, use Electron for cross-platform support
- **Backup Plan:** Focus on macOS first (most common for hackathons)

**Risk:** Performance issues with long recordings

- **Mitigation:** Implement chunking, use efficient algorithms, test with 30+ minute recordings
- **Backup Plan:** Add analysis length limit (e.g., 30 minutes)

**Risk:** AI API costs and rate limits

- **Mitigation:** Implement intelligent frame selection, cache results, use free tiers effectively
- **Backup Plan:** Limit AI analysis to first 10 minutes, add user controls for AI usage

**Risk:** Complex retention analysis accuracy

- **Mitigation:** Use multiple analysis approaches, validate against known patterns, implement confidence scoring
- **Backup Plan:** Focus on basic transcription and simple engagement metrics

### Time Risks

**Risk:** Scope creep

- **Mitigation:** Strict adherence to MVP features, defer advanced features
- **Backup Plan:** Cut AI features to basic transcription only, keep core analysis functionality

**Risk:** Underestimating AI integration complexity

- **Mitigation:** Allocate extra time for AI services, start with simple operations
- **Backup Plan:** Use pre-built AI SDKs, skip custom analysis algorithms

**Risk:** UI takes longer than expected

- **Mitigation:** Use shadcn/ui components, keep UI simple and functional
- **Backup Plan:** Use minimal UI, focus on core functionality

---

## AI Services Integration

### Core AI Features

**1. Video Upload and Transcription**

- Upload video files for processing
- Extract audio and send to Deepgram for transcription
- Display synchronized transcript with timeline
- Support for multiple audio formats and quality levels

**2. Multimodal Video Analysis**

- Use Gemini Multimodal (Flash 3 or Pro 3) for comprehensive video analysis
- Intelligent frame selection algorithm (analyze first 15 minutes strategically)
- Extract key frames at content transitions and engagement points
- Analyze visual content, speaker presence, and screen activity

**3. Retention Analysis Dashboard**

- Display viewer engagement predictions based on content analysis
- Identify potential drop-off points in the video
- Provide retention scores for different sections
- Suggest improvements to maintain viewer attention

**4. Intelligent Editing Interface**

- Timeline-based editor with AI suggestions
- Automatic detection of silence parts for removal
- Suggestions for moving, removing, or speeding up sections
- Visual indicators for AI-recommended edits

**5. Script and Visual Enhancement**

- AI-powered suggestions for script improvements
- Recommendations for visual enhancements and transitions
- Content pacing suggestions based on analysis
- Automatic chapter generation for better navigation

**6. SEO Optimization Suite**

- Generate SEO-optimized titles with attention-grabbing elements
- Create compelling descriptions for YouTube and other platforms
- Automatic tag generation based on content analysis
- YouTube chapter markers for better discoverability
- Integration with YouTube Data API v3 for platform-specific optimization

**7. Thumbnail Generation**

- AI-powered thumbnail generation using Gemini Nano
- Multiple thumbnail options based on key frames
- A/B testing suggestions for thumbnail effectiveness
- Custom thumbnail creation with text overlays

---

## GLM-4.7 + Cline Integration

### What to Build with GLM-4.7

**High-Value Components:**

1. **Content Analysis Engine** - Complex algorithms for silence detection and chapter generation
2. **AI Integration Layer** - Deepgram, Gemini Multimodal, and YouTube API integrations
3. **TypeScript Type Definitions** - Complex types for timeline, segments, AI analysis, insights
4. **UI Components** - shadcn/ui integration and customization for AI features
5. **SEO Optimization Engine** - Content analysis and metadata generation
6. **Retention Analysis System** - Suspense detection and engagement prediction algorithms

### Documentation Requirements

**PROMPTS.md:**

- List 5-10 exact prompts used with Cline
- Include prompts for each major component
- Show iterative refinement process

**README:**

- Add "Built with Cline + GLM-4.7" section
- Describe which parts were AI-assisted
- Highlight GLM-4.7's strengths (speed, code quality)
- Document AI services integration (Deepgram, Gemini, YouTube API)

**Submission:**

- Explicitly state how GLM-4.7 was used
- Include commit history showing AI-generated code
- Mention specific features enabled by GLM-4.7's speed
- Showcase AI-powered features in demo

### Example Prompts

```
"Build a silence detection algorithm that analyzes audio levels and identifies periods of silence below -40dB lasting more than 2 seconds. Return a list of silence segments with start and end times."

"Create an FFmpeg pipeline that removes silence segments, speeds up non-speech sections by 2x, and adds smooth fade transitions between segments."

"Design TypeScript types for a timeline system that includes segments, chapter markers, AI analysis results, and export settings. Ensure type safety throughout."

"Build a React component for timeline visualization that displays segments, chapter markers, AI suggestions, and allows drag-and-drop editing."

"Create an export preset system with validation for different platforms (Twitter, Discord, YouTube) including resolution, frame rate, and codec settings."

"Implement Deepgram API integration for audio transcription with error handling, retry logic, and timeline synchronization."

"Build Gemini Multimodal integration for video frame analysis with intelligent frame selection and content understanding."

"Create an SEO optimization engine that analyzes video content and generates YouTube-ready titles, descriptions, tags, and chapters."

"Design a retention analysis dashboard that visualizes viewer engagement predictions and provides actionable improvement suggestions."

"Build an AI-powered thumbnail generation system using Gemini Nano with multiple layout options and text overlay capabilities."
```

---

## Deliverables

### Code Deliverables

- [ ] Complete Electron application
- [ ] Next.js frontend with all views (including AI Analysis view)
- [ ] Express backend with API endpoints
- [ ] Content analysis engine
- [ ] AI integration layer (Deepgram, Gemini, YouTube API)
- [ ] SEO optimization engine
- [ ] Retention analysis system
- [ ] Thumbnail generation system

### Documentation Deliverables

- [ ] README with setup instructions
- [ ] User guide (including AI features documentation)
- [ ] Developer documentation
- [ ] PROMPTS.md with Cline usage
- [ ] API documentation
- [ ] AI services integration guide

### Submission Deliverables

- [ ] Demo video (< 2 minutes)
- [ ] GitHub repository
- [ ] Project description
- [ ] AI services usage documentation
- [ ] Screenshots
- [ ] AI feature demonstration video

---

## Next Steps

1. **Immediate (Hour 0-1):**
   - Get Cerebras API key
   - Install Cline in VS Code
   - Configure GLM-4.7 as model
   - Initialize project structure
   - Set up AI service accounts (Deepgram, Gemini, YouTube)

2. **Short-term (Hour 1-6):**
   - Set up development environment
   - Implement video upload module
   - Build content analysis engine
   - Integrate Deepgram for transcription

3. **Medium-term (Hour 6-18):**
   - Develop UI components
   - Integrate Gemini Multimodal for video analysis
   - Build SEO optimization features
   - Create retention analysis system
   - Test and polish

4. **Final (Hour 18-21):**
   - Create demo video
   - Prepare submission
   - Final testing
   - Document AI integration

---

## Appendix

### File Structure

```
demo-forge/
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   └── package.json
├── src/
│   ├── app/
│   │   ├── upload/
│   │   ├── analysis/
│   │   ├── insights/
│   │   └── settings/
│   ├── components/
│   │   ├── ui/
│   │   ├── upload/
│   │   ├── analysis/
│   │   ├── insights/
│   │   └── settings/
│   ├── lib/
│   │   ├── analysis/
│   │   │   ├── audio.ts
│   │   │   └── content.ts
│   │   ├── ai/
│   │   │   ├── deepgram.ts
│   │   │   ├── gemini.ts
│   │   │   └── youtube.ts
│   │   └── seo/
│   │       └── optimizer.ts
│   └── types/
│       └── index.ts
├── docs/
│   ├── PRD.md
│   ├── USER_GUIDE.md
│   ├── AI_INTEGRATION.md
│   └── PROMPTS.md
└── package.json
```

### Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "electron": "^28.0.0",
    "react-player": "^2.13.0",
    "wavesurfer.js": "^7.0.0",
    "date-fns": "^3.0.0",
    "@deepgram/sdk": "^3.0.0",
    "@google/generative-ai": "^0.15.0",
    "googleapis": "^128.0.0",
    "@tensorflow/tfjs": "^4.15.0",
    "canvas": "^2.11.2"
  }
}
```

### Environment Variables

```env
# Required API Keys
DEEPGRAM_API_KEY=your_deepgram_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional Configuration
NODE_ENV=development
LOG_LEVEL=info

# Future Integration
YOUTUBE_API_KEY=your_youtube_api_key
```

**AI Service Configuration:**

- Deepgram: Nova-2 model with smart formatting and speaker diarization
- Gemini: Multiple model support with automatic fallback:
  - Primary: gemini-3-flash-latest (latest available)
  - Fallback: gemini-2.5-flash (most stable), gemini-2.5-flash-lite (fastest), gemini-3-pro-latest (highest quality)
- Production-grade error handling with exponential backoff (1s to 10s)
- Rate limiting: 500ms between requests
- Request timeout: 2 minutes
- Maximum retries: 3

**Analysis Configuration:**

- Supported video duration: 1 second to 4 hours (14,400 seconds)
- Max transcription length: 50,000 characters
- Max keyframes: 10 per analysis request
- Keyframe format: JPEG (quality 85%, max 1280x720)
- Category-based keyframe requirements for enhanced analysis
- Silence detection threshold: -40dB
- Minimum silence duration: 2 seconds

---

**Document Version:** 1.0  
**Last Updated:** January 23, 2026  
**Status:** Ready for Implementation
