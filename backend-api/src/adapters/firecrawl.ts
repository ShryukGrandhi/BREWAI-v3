/**
 * BREWAI v4 Firecrawl Adapter
 * Author: BUILD-AGENT v1
 * 
 * Web crawling adapter for ingesting web content into knowledge base.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  includePaths?: string[];
  excludePaths?: string[];
  extractMainContent?: boolean;
}

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  links: string[];
  metadata: {
    description?: string;
    author?: string;
    publishedDate?: string;
    language?: string;
  };
  tags: string[];
}

class FirecrawlAdapter {
  private client: AxiosInstance;
  private isSimulated: boolean;

  constructor() {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const baseUrl = process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev/v0';
    
    this.isSimulated = process.env.FIRECRAWL_SIMULATE === 'true' || 
                       !apiKey || 
                       apiKey === 'your-firecrawl-api-key';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (this.isSimulated) {
      logger.warn('Firecrawl adapter running in simulation mode');
    }
  }

  /**
   * Crawl a URL and extract content
   */
  async crawl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    if (this.isSimulated) {
      return this.simulateCrawl(url, options);
    }

    try {
      // Start crawl job
      const startResponse = await this.client.post('/crawl', {
        url,
        maxDepth: options.maxDepth || 1,
        maxPages: options.maxPages || 1,
        includePaths: options.includePaths,
        excludePaths: options.excludePaths,
      });

      const jobId = startResponse.data.jobId;

      // Poll for results
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await this.client.get(`/crawl/${jobId}`);
        
        if (statusResponse.data.status === 'completed') {
          const page = statusResponse.data.data[0];
          
          return {
            url: page.url,
            title: page.metadata?.title || this.extractTitle(url),
            content: page.content || page.html || '',
            links: page.links || [],
            metadata: {
              description: page.metadata?.description,
              author: page.metadata?.author,
              publishedDate: page.metadata?.publishedDate,
              language: page.metadata?.language,
            },
            tags: this.extractTags(page.content || ''),
          };
        }

        if (statusResponse.data.status === 'failed') {
          throw new Error('Crawl job failed');
        }

        attempts++;
      }

      throw new Error('Crawl job timed out');
    } catch (error) {
      logger.error('Firecrawl error:', error);
      throw new Error('Failed to crawl URL');
    }
  }

  /**
   * Scrape a single page (no crawling)
   */
  async scrape(url: string): Promise<CrawlResult> {
    if (this.isSimulated) {
      return this.simulateCrawl(url, {});
    }

    try {
      const response = await this.client.post('/scrape', { url });
      const data = response.data.data;

      return {
        url,
        title: data.metadata?.title || this.extractTitle(url),
        content: data.content || data.html || '',
        links: data.links || [],
        metadata: {
          description: data.metadata?.description,
          author: data.metadata?.author,
          publishedDate: data.metadata?.publishedDate,
          language: data.metadata?.language,
        },
        tags: this.extractTags(data.content || ''),
      };
    } catch (error) {
      logger.error('Firecrawl scrape error:', error);
      throw new Error('Failed to scrape URL');
    }
  }

  /**
   * Simulate crawl for development
   */
  private simulateCrawl(url: string, _options: CrawlOptions): CrawlResult {
    const domain = new URL(url).hostname;
    
    logger.info({ url }, 'Simulating Firecrawl crawl');

    return {
      url,
      title: `Sample Page from ${domain}`,
      content: `
# Sample Crawled Content

This is simulated content from ${url}.

## About This Restaurant

We are a family-owned restaurant dedicated to serving fresh, locally-sourced cuisine. 
Our menu changes seasonally to reflect the best ingredients available.

## Our Hours

- Monday - Thursday: 11am - 9pm
- Friday - Saturday: 11am - 10pm
- Sunday: 10am - 8pm (Brunch until 2pm)

## Location

123 Main Street
Anytown, USA 12345

## Contact

Phone: (555) 123-4567
Email: info@restaurant.example.com

## Menu Highlights

- Farm Fresh Salads
- Wood-Fired Pizzas
- Seasonal Specials
- Craft Cocktails

Last updated: ${new Date().toISOString()}
      `.trim(),
      links: [
        `${url}/menu`,
        `${url}/about`,
        `${url}/contact`,
        `${url}/reservations`,
      ],
      metadata: {
        description: `Discover the best dining experience at ${domain}`,
        author: 'Restaurant Team',
        publishedDate: new Date().toISOString(),
        language: 'en',
      },
      tags: ['restaurant', 'dining', 'menu', 'local'],
    };
  }

  /**
   * Extract title from URL
   */
  private extractTitle(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      if (path && path !== '/') {
        return path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || parsedUrl.hostname;
      }
      return parsedUrl.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: Set<string> = new Set();
    const keywords = ['menu', 'restaurant', 'food', 'dining', 'chef', 'cuisine', 
                      'reservation', 'order', 'delivery', 'takeout', 'lunch', 'dinner',
                      'breakfast', 'brunch', 'wine', 'beer', 'cocktail', 'dessert'];
    
    const lowerContent = content.toLowerCase();
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        tags.add(keyword);
      }
    }

    return Array.from(tags).slice(0, 10);
  }
}

export const firecrawlAdapter = new FirecrawlAdapter();
export default firecrawlAdapter;
