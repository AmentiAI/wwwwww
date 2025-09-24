import axios from 'axios'

export interface GoogleSearchResult {
  title: string
  link: string
  snippet: string
}

export async function searchGoogle(query: string, numResults: number = 100): Promise<GoogleSearchResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !searchEngineId) {
    throw new Error('Google API credentials not configured')
  }

  // Enhance query to focus on businesses
  const businessQuery = enhanceQueryForBusinesses(query)

  const allResults: GoogleSearchResult[] = []
  const resultsPerPage = 10 // Google Custom Search API max per request
  const maxPages = Math.ceil(numResults / resultsPerPage)
  
  try {
    for (let page = 0; page < maxPages && allResults.length < numResults; page++) {
      const startIndex = page * resultsPerPage + 1 // Google uses 1-based indexing
      
      console.log(`Fetching page ${page + 1}/${maxPages}, starting at result ${startIndex}`)
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: businessQuery,
          num: resultsPerPage,
          start: startIndex,
          // Add additional parameters to focus on business websites
          siteSearch: '', // We'll filter results instead
        },
      })

      if (response.data.error) {
        console.error('Google Search API error:', response.data.error)
        throw new Error(`Google Search API error: ${response.data.error.message || 'Unknown error'}`)
      }

      const pageResults = response.data.items?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      })) || []

      if (pageResults.length === 0) {
        console.log(`No more results found at page ${page + 1}`)
        break // No more results available
      }

      allResults.push(...pageResults)
      
      // Add a small delay between requests to be respectful to the API
      if (page < maxPages - 1 && allResults.length < numResults) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`Fetched ${allResults.length} total results before filtering`)

    // Filter results to focus on business websites, but be less aggressive
    const filteredResults = filterBusinessResults(allResults)
    
    console.log(`Returning ${filteredResults.length} results after filtering`)

    // Return up to the requested number of results
    return filteredResults.slice(0, numResults)
  } catch (error: any) {
    console.error('Google Search API error:', error.response?.data || error.message)
    if (error.response?.data?.error) {
      throw new Error(`Google Search API error: ${error.response.data.error.message}`)
    }
    throw new Error('Failed to search Google')
  }
}

function enhanceQueryForBusinesses(query: string): string {
  // Simple query enhancement - just return the original query
  // This allows for pure keyword-based searching
  return query
}

function filterBusinessResults(results: GoogleSearchResult[]): GoogleSearchResult[] {
  // More conservative filtering - only exclude the most obvious non-business results
  const excludeDomains = [
    'wikipedia.org', 'reddit.com', 'youtube.com', 'facebook.com', 'twitter.com', 
    'instagram.com', 'pinterest.com', 'tumblr.com', 'medium.com', 'blogspot.com',
    'github.com', 'stackoverflow.com', 'quora.com', 'amazon.com', 'ebay.com',
    'yelp.com', 'walmart.com', 'angi.com', 'homeadvisor.com', 'manta.com', 'airbnb.com',
    'legacy.com', 'ziprecruiter.com'
  ]
  
  return results.filter(result => {
    const linkLower = result.link.toLowerCase()
    
    // Only exclude if the domain is in our exclude list or is a .gov/.mil/.edu domain
    const isExcludedDomain = excludeDomains.some(domain => 
      linkLower.includes(domain)
    ) || linkLower.includes('.gov') || linkLower.includes('.mil') || linkLower.includes('.edu')
    
    // Also exclude obvious non-business content types
    const isNonBusinessContent = 
      linkLower.includes('/wiki/') ||
      linkLower.includes('/r/') ||
      linkLower.includes('/watch?v=') ||
      result.title.toLowerCase().includes('wikipedia') ||
      result.title.toLowerCase().includes('reddit:') ||
      result.title.toLowerCase().includes('chamber') ||
      result.snippet.toLowerCase().includes('chamber of commerce')
    
    return !isExcludedDomain && !isNonBusinessContent
  })
}
