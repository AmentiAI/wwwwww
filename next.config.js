/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ENGINE_ID,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Disable static optimization for API routes
  trailingSlash: false,
}

module.exports = nextConfig
