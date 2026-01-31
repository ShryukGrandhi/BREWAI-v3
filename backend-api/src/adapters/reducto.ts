/**
 * BREWAI v4 Reducto Adapter
 * Author: BUILD-AGENT v1
 * 
 * Document parsing adapter for PDFs and other files.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface ParseOptions {
  url?: string;
  base64?: string;
  fileName: string;
  extractTables?: boolean;
  extractEntities?: boolean;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface Entity {
  type: string;
  value: string;
  confidence: number;
}

interface ParseResult {
  title: string;
  content: string;
  contentType: string;
  tables: TableData[];
  entities: Entity[];
  metadata: {
    pageCount?: number;
    author?: string;
    createdDate?: string;
    modifiedDate?: string;
  };
  tags: string[];
}

class ReductoAdapter {
  private client: AxiosInstance;
  private isSimulated: boolean;

  constructor() {
    const apiKey = process.env.REDUCTO_API_KEY;
    const baseUrl = process.env.REDUCTO_BASE_URL || 'https://api.reducto.ai/v1';
    
    this.isSimulated = process.env.REDUCTO_SIMULATE === 'true' || 
                       !apiKey || 
                       apiKey === 'your-reducto-api-key';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (this.isSimulated) {
      logger.warn('Reducto adapter running in simulation mode');
    }
  }

  /**
   * Parse a document (PDF, DOCX, etc.)
   */
  async parse(options: ParseOptions): Promise<ParseResult> {
    if (this.isSimulated) {
      return this.simulateParse(options);
    }

    try {
      const payload: Record<string, unknown> = {
        options: {
          extractTables: options.extractTables ?? true,
          extractEntities: options.extractEntities ?? true,
        },
      };

      if (options.url) {
        payload.url = options.url;
      } else if (options.base64) {
        payload.file = options.base64;
        payload.filename = options.fileName;
      }

      const response = await this.client.post('/parse', payload);
      const data = response.data;

      return {
        title: data.title || options.fileName,
        content: data.text || data.content || '',
        contentType: this.getContentType(options.fileName),
        tables: data.tables || [],
        entities: data.entities || [],
        metadata: {
          pageCount: data.metadata?.pageCount,
          author: data.metadata?.author,
          createdDate: data.metadata?.createdDate,
          modifiedDate: data.metadata?.modifiedDate,
        },
        tags: this.extractTags(data.text || data.content || ''),
      };
    } catch (error) {
      logger.error('Reducto parse error:', error);
      throw new Error('Failed to parse document');
    }
  }

  /**
   * Simulate document parsing for development
   */
  private simulateParse(options: ParseOptions): ParseResult {
    logger.info({ fileName: options.fileName }, 'Simulating Reducto parse');

    const isInvoice = options.fileName.toLowerCase().includes('invoice');
    const isMenu = options.fileName.toLowerCase().includes('menu');
    const isReport = options.fileName.toLowerCase().includes('report');

    let content = '';
    let tables: TableData[] = [];
    let entities: Entity[] = [];

    if (isInvoice) {
      content = `
SUPPLIER INVOICE

Invoice Number: INV-2024-001234
Date: ${new Date().toLocaleDateString()}
Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}

From:
Premium Food Distributors
456 Wholesale Ave
Foodtown, ST 98765

To:
Your Restaurant
123 Main Street
Anytown, USA 12345

Items:
- Fresh Tomatoes (Case of 25 lbs) x 5 @ $24.99 = $124.95
- Olive Oil (1 Gallon) x 3 @ $45.00 = $135.00
- Parmesan Cheese (Wheel) x 2 @ $89.00 = $178.00
- Fresh Basil (Bunch) x 20 @ $2.50 = $50.00

Subtotal: $487.95
Tax (8%): $39.04
Total: $526.99

Payment Terms: Net 30
      `.trim();

      tables = [
        {
          headers: ['Item', 'Quantity', 'Unit Price', 'Total'],
          rows: [
            ['Fresh Tomatoes (Case)', '5', '$24.99', '$124.95'],
            ['Olive Oil (1 Gallon)', '3', '$45.00', '$135.00'],
            ['Parmesan Cheese (Wheel)', '2', '$89.00', '$178.00'],
            ['Fresh Basil (Bunch)', '20', '$2.50', '$50.00'],
          ],
        },
      ];

      entities = [
        { type: 'invoice_number', value: 'INV-2024-001234', confidence: 0.98 },
        { type: 'total_amount', value: '$526.99', confidence: 0.95 },
        { type: 'vendor', value: 'Premium Food Distributors', confidence: 0.92 },
        { type: 'date', value: new Date().toLocaleDateString(), confidence: 0.99 },
      ];
    } else if (isMenu) {
      content = `
SEASONAL MENU

STARTERS
- Bruschetta Trio - $12
- Calamari Fritti - $14
- Burrata with Heirloom Tomatoes - $16

MAINS
- Grilled Salmon with Lemon Butter - $28
- Ribeye Steak (12oz) - $42
- Mushroom Risotto (V) - $22
- Chicken Parmesan - $24

DESSERTS
- Tiramisu - $10
- Panna Cotta - $9
- Gelato Selection - $8

(V) = Vegetarian | (GF) = Gluten Free
      `.trim();

      tables = [
        {
          headers: ['Category', 'Item', 'Price'],
          rows: [
            ['Starters', 'Bruschetta Trio', '$12'],
            ['Starters', 'Calamari Fritti', '$14'],
            ['Mains', 'Grilled Salmon', '$28'],
            ['Mains', 'Ribeye Steak', '$42'],
            ['Desserts', 'Tiramisu', '$10'],
          ],
        },
      ];

      entities = [
        { type: 'dish', value: 'Bruschetta Trio', confidence: 0.95 },
        { type: 'dish', value: 'Grilled Salmon', confidence: 0.94 },
        { type: 'price', value: '$42', confidence: 0.98 },
        { type: 'dietary', value: 'Vegetarian', confidence: 0.90 },
      ];
    } else if (isReport) {
      content = `
WEEKLY OPERATIONS REPORT

Week of: ${new Date().toLocaleDateString()}

SUMMARY
Total Revenue: $45,230
Average Check: $52.40
Covers: 863
Food Cost: 28.5%
Labor Cost: 32.1%

TOP SELLING ITEMS
1. Ribeye Steak - 145 orders
2. Grilled Salmon - 112 orders
3. Chicken Parmesan - 98 orders

INVENTORY ALERTS
- Low stock: Fresh Tomatoes (3 cases remaining)
- Low stock: Olive Oil (2 bottles remaining)
- Reorder needed: Parmesan Cheese

RECOMMENDATIONS
- Consider weekend special featuring salmon
- Schedule additional prep staff for Friday dinner
- Review wine inventory before weekend
      `.trim();

      tables = [
        {
          headers: ['Metric', 'Value'],
          rows: [
            ['Total Revenue', '$45,230'],
            ['Average Check', '$52.40'],
            ['Covers', '863'],
            ['Food Cost', '28.5%'],
            ['Labor Cost', '32.1%'],
          ],
        },
      ];

      entities = [
        { type: 'metric', value: 'Total Revenue: $45,230', confidence: 0.97 },
        { type: 'metric', value: 'Food Cost: 28.5%', confidence: 0.96 },
        { type: 'alert', value: 'Low stock: Fresh Tomatoes', confidence: 0.92 },
      ];
    } else {
      content = `
DOCUMENT: ${options.fileName}

This is simulated content from the Reducto document parser.

The document appears to contain text content that has been extracted
and processed for the BREWAI knowledge base.

Key Information:
- Document processed successfully
- Content extracted from ${options.fileName}
- Ready for indexing and search

Metadata:
- Processed at: ${new Date().toISOString()}
- File type: ${this.getContentType(options.fileName)}
      `.trim();
    }

    return {
      title: options.fileName.replace(/\.[^/.]+$/, ''),
      content,
      contentType: this.getContentType(options.fileName),
      tables,
      entities,
      metadata: {
        pageCount: Math.floor(Math.random() * 5) + 1,
        author: 'System',
        createdDate: new Date().toISOString(),
      },
      tags: this.extractTags(content),
    };
  }

  /**
   * Get content type from filename
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      csv: 'text/csv',
    };
    return types[ext || ''] || 'application/octet-stream';
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: Set<string> = new Set();
    const keywords = ['invoice', 'menu', 'report', 'inventory', 'order', 'supplier',
                      'revenue', 'cost', 'staff', 'schedule', 'recipe', 'ingredient'];
    
    const lowerContent = content.toLowerCase();
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        tags.add(keyword);
      }
    }

    return Array.from(tags).slice(0, 10);
  }
}

export const reductoAdapter = new ReductoAdapter();
export default reductoAdapter;
