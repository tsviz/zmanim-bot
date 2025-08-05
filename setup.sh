#!/usr/bin/env bash

# Setup script for Jewish Event Times Tracker

echo "🕰️  Setting up Jewish Event Times Tracker..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! npx semver -r ">=$REQUIRED_VERSION" "$NODE_VERSION" &> /dev/null; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build project"
    exit 1
fi

echo "✅ Project built successfully"

# Create data directory structure
echo "📁 Creating data directory structure..."
mkdir -p data/locations data/summary

echo "✅ Data directories created"

# Check for environment variables
echo
echo "🔑 Environment Setup:"
echo "Please set the following environment variables:"
echo
echo "export MYZMANIM_USER=\"your_user_id\""
echo "export MYZMANIM_KEY=\"your_api_key\""
echo
echo "You can get these credentials from:"
echo "https://www.myzmanim.com/apiget.aspx"
echo

# Check if config file exists
if [ ! -f "config/locations.json" ]; then
    echo "❌ Configuration file config/locations.json not found"
    exit 1
fi

echo "✅ Configuration file found"

# Validate configuration
echo "📍 Configured locations:"
if command -v jq &> /dev/null; then
    jq -r '.[] | "  - \(.name) (\(.locationId))"' config/locations.json
else
    echo "  (Install jq to see location details)"
fi

echo
echo "🎉 Setup complete!"
echo
echo "Next steps:"
echo "1. Set your API credentials (see above)"
echo "2. Customize config/locations.json if needed"
echo "3. Test the setup: npm start"
echo "4. Set up GitHub repository secrets for automation"
echo
