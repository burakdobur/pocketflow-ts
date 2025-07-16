# Deployment Guide: Moving to New Repository

This guide provides multiple options for moving your PocketFlow TypeScript implementation to a new repository.

## 🚀 Quick Start (Recommended)

The easiest way is to use the included setup script:

```bash
# Navigate to your project directory
cd /tmp/pocketflow-typescript

# Run the setup script
./setup-repo.sh
```

The script will:
- ✅ Check all dependencies
- ✅ Install npm packages
- ✅ Run tests to verify everything works
- ✅ Create GitHub repository (if GitHub CLI is installed)
- ✅ Push code to the new repository

## 📋 Manual Options

### Option 1: GitHub CLI (Fastest)

If you have GitHub CLI installed:

```bash
# Navigate to project directory
cd /tmp/pocketflow-typescript

# Install dependencies and test
npm install
npm test

# Create and push repository
gh repo create pocketflow-typescript --public --source=. --remote=origin --push

# For private repository
gh repo create pocketflow-typescript --private --source=. --remote=origin --push
```

### Option 2: Manual GitHub Setup

1. **Prepare local repository:**
```bash
cd /tmp/pocketflow-typescript
git branch -m main  # Rename to main branch
npm install         # Install dependencies
npm test           # Verify everything works
```

2. **Create GitHub repository:**
   - Go to [https://github.com/new](https://github.com/new)
   - Repository name: `pocketflow-typescript` (or your choice)
   - **Don't** initialize with README (files already exist)
   - Choose public or private
   - Click "Create repository"

3. **Push to GitHub:**
```bash
# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/pocketflow-typescript.git

# Push code
git push -u origin main
```

### Option 3: Copy to New Location

If you want to move files to a different directory first:

```bash
# Create new directory
mkdir ~/my-pocketflow-typescript
cd ~/my-pocketflow-typescript

# Copy files from current location
cp -r /tmp/pocketflow-typescript/* .
cp /tmp/pocketflow-typescript/.gitignore .

# Initialize git
git init
git add .
git commit -m "Initial commit: PocketFlow TypeScript implementation"

# Follow Option 2 steps above
```

### Option 4: Fork and Modify

If you want to fork from an existing repository:

```bash
# Clone the original (if available)
git clone https://github.com/original/pocketflow-typescript.git
cd pocketflow-typescript

# Add your own remote
git remote add mine https://github.com/yourusername/pocketflow-typescript.git

# Push to your repository
git push mine main
```

## 🔧 Customization Before Deployment

### Update Package Information

Edit `package.json` to customize:

```json
{
  "name": "your-pocketflow-name",
  "author": "Your Name",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/your-repo-name.git"
  }
}
```

### Update README

Modify `README.md` to:
- Change installation instructions
- Update repository links
- Add your own examples
- Customize branding

### Environment Setup

Create `.env.example` file:
```bash
# OpenAI API Key for examples
OPENAI_API_KEY=your_openai_api_key_here

# Other environment variables
NODE_ENV=development
```

## 📦 Publishing to NPM (Optional)

If you want to publish your version to NPM:

1. **Update package.json:**
```json
{
  "name": "@yourusername/pocketflow-ts",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  }
}
```

2. **Build and publish:**
```bash
npm run build
npm login
npm publish
```

## 🌐 Deployment Platforms

### Deploy Examples to Vercel

Create `vercel.json`:
```json
{
  "builds": [
    {
      "src": "examples/**/*.ts",
      "use": "@vercel/node"
    }
  ]
}
```

### Deploy to Railway

Create `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
```

### Deploy to Render

Create `render.yaml`:
```yaml
services:
  - type: web
    name: pocketflow-examples
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
```

## 🧪 Verification Checklist

Before deploying, verify:

- [ ] All files copied correctly
- [ ] `npm install` works without errors
- [ ] `npm test` passes all tests
- [ ] `npm run build` creates `dist/` folder
- [ ] Examples run: `npm run example:hello-world`
- [ ] Git repository initialized
- [ ] Remote origin set correctly
- [ ] All commits pushed

## 🔒 Security Considerations

### Secrets Management

Never commit:
- API keys
- Environment variables with sensitive data
- Personal access tokens

Use:
- `.env` files (add to `.gitignore`)
- GitHub Secrets for CI/CD
- Environment variable injection

### Dependency Security

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

## 🚀 CI/CD Setup

### GitHub Actions

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
```

### Auto-Release

Create `.github/workflows/release.yml`:
```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📞 Support

If you encounter issues:

1. Check the [QUICKSTART.md](QUICKSTART.md) guide
2. Review [MIGRATION.md](MIGRATION.md) for Python differences
3. Run the test suite: `npm test`
4. Check example outputs: `npm run example:hello-world`

## 🎉 What's Next?

After deployment:

1. **Share your repository** with the community
2. **Add more examples** specific to your use case
3. **Contribute back** improvements to the original project
4. **Build amazing LLM applications** with PocketFlow TypeScript!

---

**Ready to deploy?** Run `./setup-repo.sh` and follow the prompts!