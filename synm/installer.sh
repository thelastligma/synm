#!/bin/bash

echo "======================================="
echo "        synm macOS Installer"
echo "======================================="

# -----------------------
# Detect CPU Architecture
# -----------------------
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    CPU_TYPE="Apple Silicon (ARM64)"
    TARGET_DIR="synm-darwin-arm64"
elif [ "$ARCH" = "x86_64" ]; then
    CPU_TYPE="Intel (x64)"
    TARGET_DIR="synm-darwin-x64"
else
    CPU_TYPE="Unknown"
fi

echo "➡️  Detected Mac: $CPU_TYPE"
echo ""

# -----------------------
# Create Temp Build Dir
# -----------------------
BUILD_DIR="/tmp/synm-build.$(date +%s)"
echo "➡️  Creating build directory: $BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR" || exit 1

# -----------------------
# Clone Repo
# -----------------------
echo "➡️  Cloning synm repo..."
git clone https://github.com/thelastligma/synm.git

if [ ! -d "synm" ]; then
    echo "❌ Failed to clone repo. Exiting."
    exit 1
fi

# Go inside inner synm folder
cd synm/synm || exit 1

# -----------------------
# Install Dependencies
# -----------------------
echo "➡️  Installing Node dependencies..."

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm not installed. Install Node.js first."
    exit 1
fi

npm install

# -----------------------
# Build App
# -----------------------
echo "➡️  Building macOS .app (this may take a moment)..."

if npm run build; then
    echo "✔ Build complete."
else
    echo "❌ Build failed."
    exit 1
fi

# -----------------------
# Locate Correct .app
# -----------------------
APP_PATH="dist/$TARGET_DIR/synm.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ Could not find built app: $APP_PATH"
    exit 1
fi

echo "➡️  Found app: $APP_PATH"

# -----------------------
# Install to /Applications
# -----------------------
echo "➡️  Installing synm.app to /Applications..."

sudo rm -rf "/Applications/synm.app" 2>/dev/null
sudo cp -R "$APP_PATH" /Applications/

if [ $? -eq 0 ]; then
    echo "✔ synm.app installed to /Applications!"
else
    echo "❌ Failed to install synm.app"
    exit 1
fi

# -----------------------
# Cleanup
# -----------------------
echo "➡️  Cleaning up..."
rm -rf "$BUILD_DIR"

echo ""
echo "======================================="
echo "      synm Installed Successfully!"
echo "======================================="
echo "You can now open synm from your Applications folder."
