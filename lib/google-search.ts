import axios from 'axios'

export interface GoogleSearchResult {
  title: string
  link: string
  snippet: string
}

export async function searchGoogle(query: string, numResults: number = 10): Promise<GoogleSearchResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !searchEngineId) {
    throw new Error('Google API credentials not configured')
  }

  // Google Custom Search API limits num to 10
  const limitedNum = Math.min(numResults, 10)

  // Enhance query to focus on businesses
  const businessQuery = enhanceQueryForBusinesses(query)

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: businessQuery,
        num: limitedNum,
        // Add additional parameters to focus on business websites
        siteSearch: '', // We'll filter results instead
      },
    })

    if (response.data.error) {
      console.error('Google Search API error:', response.data.error)
      throw new Error(`Google Search API error: ${response.data.error.message || 'Unknown error'}`)
    }

    const results = response.data.items?.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    })) || []

    // Filter results to focus on business websites
    return filterBusinessResults(results)
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
  // Simple filtering - just exclude obvious non-website results
  const nonWebsiteKeywords = [
    'wikipedia', 'reddit', 'youtube', 'facebook', 'twitter', 'instagram',
    'linkedin', 'pinterest', 'tumblr', 'medium', 'blogspot', 'wordpress.com',
    'github', 'stackoverflow', 'quora', 'yelp', 'tripadvisor', 'amazon',
    'ebay', 'etsy', 'news', 'article', 'forum', 'discussion'
  ]
  
  return results.filter(result => {
    const titleLower = result.title.toLowerCase()
    const snippetLower = result.snippet.toLowerCase()
    const linkLower = result.link.toLowerCase()
    
    // Exclude obvious non-website results
    const isNonWebsite = nonWebsiteKeywords.some(keyword => 
      titleLower.includes(keyword) || 
      snippetLower.includes(keyword) || 
      linkLower.includes(keyword)
    )
    
    return !isNonWebsite
  })
}
