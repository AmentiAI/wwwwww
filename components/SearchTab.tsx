'use client'

import { useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface SearchResult {
  title: string
  link: string
  snippet: string
}

export default function SearchTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, numResults: 10 })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(data.results)
        toast.success(`Found ${data.results.length} results`)
      } else {
        toast.error(data.error || 'Search failed')
      }
    } catch (error) {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleScrapeSelected = async () => {
    if (results.length === 0) {
      toast.error('No results to scrape')
      return
    }

    const urls = results.map(result => result.link)
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(
          `Scraped ${data.results.domainsProcessed} domains, found ${data.results.emailsFound} emails, added ${data.results.emailsAdded} new emails`
        )
      } else {
        toast.error(data.error || 'Scraping failed')
      }
    } catch (error) {
      toast.error('Scraping failed')
    }
  }

  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Google Search</h2>
          <p className="text-gray-600">Enter keywords to search Google and get website URLs</p>
        </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter keywords to search (e.g., 'plumbing services', 'restaurants', 'web design')..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
                  {loading ? 'Searching...' : 'Search Google'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Search Results ({results.length})</h3>
            <button
              onClick={handleScrapeSelected}
              className="btn-secondary"
            >
              Scrape All Domains
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{result.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{result.snippet}</p>
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      {result.link}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
