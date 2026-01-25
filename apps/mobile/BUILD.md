# Building AI Director Mobile App

This guide covers building the React Native mobile app for both Android and iOS platforms.

## Prerequisites

### For Android
- **Java JDK 17** (OpenJDK or Oracle)
- **Android Studio** with Android SDK
- **Node.js 18+** and **pnpm**

### For iOS (macOS only)
- **Xcode 15+** with iOS SDK
- **CocoaPods** (`sudo gem install cocoapods`)
- **Node.js 18+** and **pnpm**

## Setup

1. **Install dependencies:**
   ```bash
   cd apps/mobile
   pnpm install
   ```

2. **Generate native projects (already done):**
   ```bash
   npx expo prebuild --platform all
   ```

## Android Build

### Development Build

1. **Start Metro bundler:**
   ```bash
   pnpm start
   ```

2. **Run on device/emulator:**
   ```bash
   pnpm android
   # or
   npx expo run:android
   ```

### Production APK

1. **Build debug APK:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

2. **Build release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Production AAB (for Google Play)

```bash
cd android
./gradlew bundleRelease
```
AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

## iOS Build (macOS only)

### Setup CocoaPods

```bash
cd ios
pod install
```

### Development Build

1. **Start Metro bundler:**
   ```bash
   pnpm start
   ```

2. **Run on simulator/device:**
   ```bash
   pnpm ios
   # or
   npx expo run:ios
   ```

### Production Build

1. **Open in Xcode:**
   ```bash
   open ios/AIDirectorMobile.xcworkspace
   ```

2. **In Xcode:**
   - Select your development team
   - Choose target device (simulator/device)
   - Product → Archive
   - Distribute app via App Store Connect

## Environment Setup

### Android SDK Setup

1. **Install Android Studio**
2. **Set environment variables:**
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### iOS Setup (macOS)

1. **Install Xcode from App Store**
2. **Install Xcode Command Line Tools:**
   ```bash
   xcode-select --install
   ```
3. **Install CocoaPods:**
   ```bash
   sudo gem install cocoapods
   ```

## Build Scripts

### package.json scripts

```json
{
  "scripts": {
    "android": "expo run:android",
    "ios": "expo run:ios",
    "build:android:debug": "cd android && ./gradlew assembleDebug",
    "build:android:release": "cd android && ./gradlew assembleRelease",
    "build:android:bundle": "cd android && ./gradlew bundleRelease"
  }
}
```

## Troubleshooting

### Android Issues

**Gradle build fails:**
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

**Metro bundler conflicts:**
```bash
npx react-native start --reset-cache
```

### iOS Issues

**Pod install fails:**
```bash
cd ios
pod deintegrate
pod install
```

**Xcode build fails:**
- Clean build folder (⌘+⇧+K)
- Delete derived data
- Restart Xcode

## App Signing

### Android

1. **Generate keystore:**
   ```bash
   keytool -genkey -v -keystore release-key.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure in `android/gradle.properties`:**
   ```
   MYAPP_RELEASE_STORE_FILE=release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=release
   MYAPP_RELEASE_STORE_PASSWORD=***
   MYAPP_RELEASE_KEY_PASSWORD=***
   ```

### iOS

- Configure in Xcode project settings
- Use Apple Developer account
- Set up provisioning profiles

## Distribution

### Google Play Store

1. Build AAB: `./gradlew bundleRelease`
2. Upload to Play Console
3. Fill store listing
4. Submit for review

### Apple App Store

1. Archive in Xcode
2. Upload to App Store Connect
3. Configure app metadata
4. Submit for review

## CI/CD

### GitHub Actions Example

```yaml
name: Build Mobile
on: [push]
jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - run: cd apps/mobile && pnpm install
      - run: cd apps/mobile/android && ./gradlew assembleDebug
  
  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd apps/mobile && pnpm install
      - run: cd apps/mobile/ios && pod install
      - run: cd apps/mobile && npx expo run:ios --configuration Release
```

## Next Steps

1. Test on physical devices
2. Configure app signing for production
3. Set up crash reporting (Sentry, Bugsnag)
4. Configure deep linking
5. Set up over-the-air updates (Expo Updates)