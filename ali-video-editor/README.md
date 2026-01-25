# Video Copilot

> Analyze once, optimize forever

AI-powered video analysis platform for comprehensive retention insights and content optimization, built with Next.js and advanced AI services.

## 🚀 Features

- **Video Upload**: Drag-and-drop interface for existing video files
- **YouTube Import**: Download and analyze videos directly from YouTube URLs
- **AI-Powered Transcription**: High-accuracy audio transcription using Deepgram Nova-2
- **Advanced Retention Analysis**: Multimodal AI analysis using Gemini for suspense, curiosity, and engagement detection
- **Comprehensive AI Insights**: Intelligent suggestions for script, visual, and pacing improvements
- **Analysis History**: Local browser-based storage for past analyses with search and filtering
- **SEO Optimization**: Automatic metadata generation for better discoverability
- **Knowledge Base Integration**: LLM-enhanced analysis with video production best practices

## 🛠️ Tech Stack

### Core Framework

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand
- **Animations**: Framer Motion

### AI Services

- **Deepgram SDK**: Audio transcription with Nova-2 model
- **Google Generative AI**: Gemini for multimodal video analysis
- **Knowledge Base**: Structured JSON files for LLM enhancement

### Data & Media

- **Local Storage**: SQLite via better-sqlite3 for analysis history
- **Video Processing**: FFmpeg for audio extraction
- **Audio Visualization**: WaveSurfer.js

### Development Tools

- **Logging**: Winston (server-side), console (client-side)
- **Validation**: Zod for schema validation
- **Type Safety**: Comprehensive TypeScript definitions
- **Quality**: ESLint, Prettier, Husky pre-commit hooks

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Deepgram API key ([get one here](https://deepgram.com))
- Gemini API key ([get one here](https://makersuite.google.com/app/apikey))

## 🚦 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/vmatresu/videocopilot.git
cd videocopilot

# Install dependencies
npm install
```

### Configuration

Create a `.env.local` file (copy from `.env.example`):

```env
# API Keys (Required)
DEEPGRAM_API_KEY=your_deepgram_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional Configuration
NODE_ENV=development
LOG_LEVEL=info
```

> **Note**: API keys can also be configured through the Settings modal in the app UI.

### Development

```bash
# Run Next.js development server
npm run dev

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Format code
npm run format
```

### Building

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📁 Project Structure

```
videocopilot/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/                # API routes (transcribe, analyze, etc.)
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── history/            # Analysis history components
│   │   ├── motion/             # Animation components
│   │   ├── navigation/         # Navigation components
│   │   ├── ui/                 # UI primitives
│   │   ├── UploadStage.tsx     # Video upload interface
│   │   ├── ResultsView.tsx     # Analysis results display
│   │   └── Timeline.tsx        # Video timeline visualization
│   ├── lib/                    # Utility libraries
│   │   ├── ai/                 # AI service integrations
│   │   ├── analysis/           # Content analysis services
│   │   ├── database/           # SQLite history storage
│   │   ├── insights/           # AI insights generation
│   │   └── upload/             # Video upload handling
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── LLM_knowledge_Base/         # LLM knowledge base for AI enhancement
│   ├── 01_core_concepts/       # Dopamine engagement, retention psychology
│   ├── 02_scripting/           # AV script format, narrative techniques
│   ├── 03_visual_editing/      # Kinetic typography, pacing, transitions
│   ├── 04_audio_design/        # Mixing techniques, sound layers
│   ├── 05_seo_metadata/        # Title optimization, descriptions
│   ├── 06_style_guides/        # Creator style guides
│   ├── 07_tools_workflows/     # Software comparison, workflows
│   └── 08_checklists/          # Retention and SEO checklists
├── docs/                       # Documentation
└── public/                     # Static assets
```

## 🎯 Core Modules

### Video Upload Module

- Drag-and-drop file upload interface
- YouTube URL import with automatic download
- Video format validation (MP4, MOV, AVI, WebM)
- Metadata extraction (duration, resolution, codec)
- Upload progress tracking

### AI Transcription Service (Deepgram)

- High-accuracy audio transcription using Nova-2 model
- Speaker diarization
- Word-level timestamps
- Confidence scores
- Punctuation and paragraph formatting

### Multimodal Video Analysis (Gemini)

- Comprehensive content analysis with knowledge base integration
- Suspense and curiosity moment detection
- Retention score prediction with confidence intervals
- Emotional tone analysis
- Visual scene classification
- Production-grade error handling with retry logic

### Content Analysis Engine

- Silence detection and speech segment identification
- Timeline generation with segments
- Chapter marker generation
- Audio level analysis

### AI Insights Engine

- Script suggestions for content improvement
- Visual recommendations for engagement
- Pacing suggestions for better flow
- SEO metadata generation (title, description, tags)
- Top actionable insights

### Analysis History

- Offline persistence using SQLite (browser-based)
- Search and filter past analyses
- Export analysis results as JSON
- Track improvements over time

## 🔧 Configuration

### Environment Variables

```env
# API Keys (Required)
DEEPGRAM_API_KEY=your_deepgram_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional Configuration
NODE_ENV=development              # Environment (development/production)
LOG_LEVEL=info                   # Logging level (error/warn/info/debug)
```

### AI Service Configuration

**Deepgram Service:**
- Model: nova-2
- Language: en-US
- Features: smart_format, punctuate, paragraphs, diarize, utterances

**Gemini Service:**
- Primary Model: gemini-3-flash-latest
- Fallback Models: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-3-pro-latest
- Rate limiting: 500ms between requests
- Request timeout: 2 minutes
- Maximum retries: 3 with exponential backoff

## 📝 Development Guidelines

### Code Quality

- All code must pass ESLint and TypeScript checks
- Use Prettier for consistent formatting
- Follow SOLID principles
- Write comprehensive JSDoc comments
- Implement proper error handling for all operations

### Commit Messages

Follow conventional commits format:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### Before Committing

```bash
# Run linting and fix issues
npm run lint:fix

# Run type checking
npm run typecheck

# Format code
npm run format
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Cerebras](https://www.cerebras.ai) for the hackathon opportunity
- [Deepgram](https://deepgram.com) for transcription services
- [Google](https://ai.google.dev) for Gemini AI services
- [Next.js](https://nextjs.org) for React framework

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Video Copilot** - Empowering content creators with AI-powered video analysis.
