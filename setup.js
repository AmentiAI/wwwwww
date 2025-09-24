#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Domain Email Scraper...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  const envContent = `# Database
DATABASE_URL="file:./dev.db"

# Google Search API
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local created! Please update it with your API keys.\n');
} else {
  console.log('✅ .env.local already exists.\n');
}

console.log('📋 Next steps:');
console.log('1. Update .env.local with your API keys');
console.log('2. Run: npm run setup');
console.log('3. Run: npm run dev');
console.log('\n🎉 Setup complete!');
