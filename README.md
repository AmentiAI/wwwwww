# Domain Email Scraper

A Next.js application for searching Google, scraping domains for contact emails, and managing email outreach campaigns.

## Features

### 1. Google Search Tab
- Enter keywords to search Google using the Custom Search API
- View search results with titles, snippets, and URLs
- One-click scraping of all search result domains

### 2. Domain Scraping Tab
- Automatically extracts domains from URLs
- Removes duplicates and checks against existing database records
- Scrapes up to 3 pages per domain (homepage, contact, about)
- Extracts email addresses using regex patterns
- Stores domains and emails in database with duplicate prevention

### 3. Email Outreach Tab
- View all scraped emails organized by domain
- Send personalized outreach emails
- Track contact status (contacted/not contacted)
- Bulk email sending capabilities
- Automatic domain and email marking after contact

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Google Search API
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

### 3. Google Custom Search API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Custom Search API
4. Create credentials (API Key)
5. Create a Custom Search Engine at [cse.google.com](https://cse.google.com/)
6. Get your Search Engine ID

### 4. Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this password in `EMAIL_PASS`

### 5. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Search and Scrape
1. Go to the "Google Search" tab
2. Enter your search keywords
3. Click "Search" to get results
4. Click "Scrape All Domains" to extract emails from all domains

### 2. Manage Contacts
1. Go to the "Domain Scraping" tab
2. View all scraped domains and emails
3. Filter by contact status
4. Monitor scraping statistics

### 3. Send Outreach
1. Go to the "Email Outreach" tab
2. Review uncontacted emails
3. Send individual emails or bulk send
4. Track contact status

## Database Schema

- **Domain**: Stores domain URLs with contact status
- **Email**: Stores email addresses linked to domains with contact status

## API Endpoints

- `POST /api/search` - Google search
- `POST /api/scrape` - Scrape domains for emails
- `POST /api/outreach` - Send outreach email
- `GET /api/domains` - Get domains and emails

## Technologies Used

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Prisma ORM with SQLite
- Google Custom Search API
- Nodemailer for email sending
- Cheerio for web scraping
- React Hot Toast for notifications

## Notes

- The scraper respects robots.txt and implements rate limiting
- Email extraction uses regex patterns for common email formats
- All operations include duplicate prevention
- Contact status is tracked at both domain and email levels
