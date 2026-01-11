/**
 * Firecrawl Integration Service
 * Web scraping for competitor analysis and data gathering
 * Uses backend API endpoint for server-side scraping
 */

import { config } from '../config'

class FirecrawlService {
  constructor() {
    this.apiBase = config.api.baseUrl
  }

  /**
   * Scrape a single URL via backend
   */
  async scrapeUrl(url, options = {}) {
    const response = await fetch(`${this.apiBase}/api/scrape/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url, 
        formats: options.formats || ['markdown'] 
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Scrape failed: ${error}`)
    }
    
    return await response.json()
  }

  /**
   * Crawl multiple pages from a starting URL
   */
  async crawlSite(url, options = {}) {
    const response = await fetch(`${this.apiBase}/api/scrape/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url, 
        limit: options.limit || 10 
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Crawl failed: ${error}`)
    }
    
    return await response.json()
  }

  /**
   * Scrape competitor data from Google Maps
   */
  async scrapeCompetitor(placeName, location = 'New York') {
    const response = await fetch(
      `${this.apiBase}/api/scrape/competitor/${encodeURIComponent(placeName)}?location=${encodeURIComponent(location)}`
    )
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Competitor scrape failed: ${error}`)
    }
    
    return await response.json()
  }

  /**
   * Scrape competitor pricing from their website
   */
  async scrapeCompetitorPricing(competitorUrl) {
    const result = await this.scrapeUrl(competitorUrl)
    
    return {
      url: competitorUrl,
      scrapedAt: new Date().toISOString(),
      data: result,
      items: this.extractPricingFromContent(result?.data?.markdown || '')
    }
  }

  /**
   * Scrape Yelp reviews for a business
   */
  async scrapeYelpReviews(businessId) {
    const url = `https://www.yelp.com/biz/${businessId}`
    return await this.scrapeUrl(url)
  }

  /**
   * Get market trends from food industry sites
   */
  async getMarketTrends() {
    const results = await this.scrapeUrl('https://www.nrn.com/food-trends')
    return results
  }

  /**
   * Extract pricing information from scraped content
   */
  extractPricingFromContent(content) {
    const priceMatches = content.match(/\$\d+\.?\d*/g) || []
    return priceMatches.slice(0, 10).map((price, index) => ({
      item: `Menu Item ${index + 1}`,
      price: parseFloat(price.replace('$', ''))
    }))
  }
}

export const firecrawlService = new FirecrawlService()
export default firecrawlService
