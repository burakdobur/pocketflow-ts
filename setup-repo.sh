#!/bin/bash

# PocketFlow TypeScript Repository Setup Script
# This script helps you set up a new repository for PocketFlow TypeScript

set -e

echo "🚀 PocketFlow TypeScript Repository Setup"
echo "==========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "📋 Checking dependencies..."

if ! command_exists git; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ All dependencies found!"

# Get repository details
echo ""
echo "📝 Repository Setup"
read -p "Enter repository name (default: pocketflow-typescript): " REPO_NAME
REPO_NAME=${REPO_NAME:-pocketflow-typescript}

read -p "Enter your GitHub username: " GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

read -p "Make repository private? (y/N): " PRIVATE_REPO
PRIVATE_FLAG=""
if [[ $PRIVATE_REPO =~ ^[Yy]$ ]]; then
    PRIVATE_FLAG="--private"
fi

# Setup local repository
echo ""
echo "🔧 Setting up local repository..."

# Rename master to main
git branch -m main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests to verify everything works
echo "🧪 Running tests..."
npm test

# Create repository on GitHub (if gh CLI is available)
echo ""
if command_exists gh; then
    echo "🌟 Creating GitHub repository..."
    gh repo create "$REPO_NAME" $PRIVATE_FLAG --source=. --remote=origin --push
    
    echo ""
    echo "✅ Repository created successfully!"
    echo "🔗 Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
else
    echo "⚠️  GitHub CLI (gh) not found. Please create repository manually:"
    echo "1. Go to https://github.com/new"
    echo "2. Create repository named: $REPO_NAME"
    echo "3. Run these commands:"
    echo ""
    echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "   git push -u origin main"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "- Read README.md for documentation"
echo "- Check QUICKSTART.md for a 5-minute tutorial"
echo "- Run examples: npm run example:hello-world"
echo "- Start building your LLM applications!"

# Optional: Open repository in browser
if command_exists gh && [[ $* == *--open* ]]; then
    echo ""
    echo "🌐 Opening repository in browser..."
    gh repo view --web
fi