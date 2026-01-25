# Mobile App

React Native (Expo) mobile application for the AI Director video repurposing platform.

## Overview

The mobile app provides a native iOS and Android experience for:
- Uploading videos from camera or library
- Monitoring AI Director processing jobs
- Browsing and previewing viral clips
- Downloading rendered shorts for sharing

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Expo SDK 52 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (Tailwind CSS) |
| State | Zustand + React Query |
| Auth | Firebase (via SecureStore) |
| Video | expo-av |
| Notifications | expo-notifications |

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home dashboard
│   │   ├── upload.tsx     # Video upload
│   │   ├── jobs.tsx       # Processing jobs
│   │   ├── director.tsx   # Viral clips gallery
│   │   └── profile.tsx    # User settings
│   ├── clip/[id].tsx      # Clip preview modal
│   ├── login.tsx          # Authentication
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── hooks/                 # Custom hooks
│   └── usePushNotifications.ts
├── store/                 # Zustand stores
│   └── auth.ts           # Auth state
├── lib/                   # Utilities
├── assets/               # Images and fonts
└── app.json              # Expo config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# From monorepo root
pnpm install

# Start mobile development server
cd apps/mobile
pnpm start
```

### Running on Device

```bash
# iOS Simulator
pnpm ios

# Android Emulator
pnpm android

# Expo Go (scan QR code)
pnpm start
```

## Features

### Home Dashboard
- Overview stats (videos, clips, ready count)
- Quick action buttons
- Recent job activity feed

### Video Upload
- Pick from photo library
- Record with camera
- Upload progress tracking
- Auto-start AI Director option

### Jobs Monitor
- Real-time job status updates
- Progress indicators
- Error display and retry
- 5-second auto-refresh

### AI Director Gallery
- Viral clips sorted by score
- Thumbnail previews
- Processing status banners
- 10-second auto-refresh

### Clip Preview
- Full video playback (expo-av)
- Viral score and metadata
- Download to device
- Native share sheet

### Push Notifications
- Job completion alerts
- Render ready notifications
- Deep linking to clips

## Configuration

### Environment Variables

Create `.env` in `apps/mobile/`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### App Configuration

Edit `app.json` for:
- App name and slug
- Bundle identifiers
- Permissions
- Splash screen
- Icons

## Shared Packages

The mobile app uses these workspace packages:

### @repo/shared-types
TypeScript types shared with web:
- `ViralClip`, `DirectorJob`
- `User`, `AuthState`
- `Job`, `Video`, `UploadProgress`

### @repo/api-client
API functions shared with web:
- `initApiClient()` - Configure base URL and auth
- `startDirectorAnalysis()` - Begin processing
- `getViralClips()` - Fetch clip list
- `uploadVideo()` - Upload with progress
- `renderViralClip()` - Start rendering

## Known Limitations

### LiveKit Recording
LiveKit's React Native SDK requires native modules not available in Expo Go.

**Solution**: Use Expo Dev Client for LiveKit features:

```bash
# Create development build
npx expo prebuild
npx expo run:ios
```

See [Expo Dev Client docs](https://docs.expo.dev/develop/development-builds/introduction/) for setup.

### Video Playback
- Large videos may require streaming optimization
- Consider HLS for long-form content

### Offline Mode
- Currently requires network connection
- Future: Add offline queue for uploads

## Building for Production

### EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### App Store Submission

1. Configure `app.json` with production values
2. Create production build with EAS
3. Submit via `eas submit`

See [EAS Submit docs](https://docs.expo.dev/submit/introduction/).

## Development Tips

### Debugging
- Use React Native Debugger
- Enable "Debug JS Remotely" in Expo Go
- Check Metro bundler logs

### Hot Reload
- Shake device or press `r` in terminal
- Fast refresh preserves state

### Testing on Device
- Use Expo Go for quick iteration
- Use Dev Client for native modules
- Test on both iOS and Android

## Roadmap

### v1.1
- [ ] LiveKit recording integration (Dev Client)
- [ ] Offline upload queue
- [ ] Biometric authentication

### v1.2
- [ ] In-app video trimming
- [ ] Custom subtitle styling
- [ ] Analytics dashboard

### v2.0
- [ ] Multi-video batch processing
- [ ] Team collaboration features
- [ ] Scheduled publishing
