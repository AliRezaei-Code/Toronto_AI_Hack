#!/bin/bash
# Build script for Android APK using Docker
# Run this from the apps/mobile directory

set -e

echo "Building Expo Android app in Docker..."

# Create output directory
mkdir -p ./output

# Build the Docker image
docker build -f Dockerfile.android -t expo-android-builder .

# Run the container and extract the APK
docker run --rm -v "$(pwd)/output:/output" expo-android-builder

echo ""
echo "Build complete! Check ./output/ for your APK file."
ls -la ./output/
