#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 PocketFlow TypeScript Environment Setup');
console.log('==========================================');

const envExamplePath = path.join(__dirname, 'env.example');
const envPath = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   If you want to reset it, delete .env and run this script again.');
  process.exit(0);
}

// Check if env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ env.example file not found!');
  process.exit(1);
}

try {
  // Copy env.example to .env
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from template');
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Edit .env with your actual API key');
  console.log('2. Run: npm run example:hello-world');
  console.log('');
  console.log('💡 Tip: The .env file is already in .gitignore, so your API key will not be committed.');
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
  process.exit(1);
} 