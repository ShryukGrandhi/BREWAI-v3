/**
 * BREWAI v4 OpenRouter Adapter
 * Author: BUILD-AGENT v1
 * 
 * LLM adapter for chat, summarization, and embeddings via OpenRouter.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenRouterAdapter {
  private client: AxiosInstance;
  private isSimulated: boolean;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    this.isSimulated = !apiKey || apiKey === 'your-openrouter-api-key';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brewai.app',
        'X-Title': 'BREWAI v4',
      },
    });

    if (this.isSimulated) {
      logger.warn('OpenRouter adapter running in simulation mode (no API key)');
    }
  }

  /**
   * Chat completion
   */
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    if (this.isSimulated) {
      return this.simulateChat(messages, options);
    }

    try {
      const response = await this.client.post<ChatResponse>('/chat/completions', {
        model: options.model || process.env.OPENROUTER_MODEL_CHAT || 'anthropic/claude-3-haiku',
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 1,
      });

      const content = response.data.choices[0]?.message?.content || '';
      
      logger.info({
        model: options.model,
        usage: response.data.usage,
      }, 'OpenRouter chat completion');

      return content;
    } catch (error) {
      logger.error('OpenRouter chat error:', error);
      throw new Error('Failed to get chat completion from OpenRouter');
    }
  }

  /**
   * Generate embeddings
   */
  async embed(text: string): Promise<number[]> {
    if (this.isSimulated) {
      return this.simulateEmbed(text);
    }

    try {
      const response = await this.client.post('/embeddings', {
        model: 'openai/text-embedding-3-small',
        input: text,
      });

      return response.data.data[0].embedding;
    } catch (error) {
      logger.error('OpenRouter embed error:', error);
      throw new Error('Failed to generate embedding from OpenRouter');
    }
  }

  /**
   * Summarize text
   */
  async summarize(text: string, maxLength: number = 200): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Summarize the following text in ${maxLength} characters or less. Be concise and capture the key points.`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    return this.chat(messages, {
      model: process.env.OPENROUTER_MODEL_SUMMARY || 'anthropic/claude-3-haiku',
      maxTokens: 300,
      temperature: 0.3,
    });
  }

  /**
   * Generate content (announcements, etc.)
   */
  async generateContent(prompt: string, context: Record<string, unknown> = {}): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful assistant for restaurant operations. Generate content based on the user's request. Context: ${JSON.stringify(context)}`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.chat(messages, {
      model: process.env.OPENROUTER_MODEL_CONTENT || 'anthropic/claude-3-sonnet',
      maxTokens: 1000,
      temperature: 0.8,
    });
  }

  /**
   * Simulation mode - generate realistic-looking responses without API
   */
  private simulateChat(messages: ChatMessage[], options: ChatOptions): string {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.content || '';

    // Simple pattern matching for common requests
    if (content.toLowerCase().includes('announcement')) {
      return JSON.stringify({
        title: 'Weekend Special!',
        body: 'Join us this weekend for our chef\'s special tasting menu. Reserve your table now!',
        confidence: 0.85,
        explanation: 'Based on typical weekend traffic patterns and seasonal ingredients.',
      });
    }

    if (content.toLowerCase().includes('summary') || content.toLowerCase().includes('summarize')) {
      return 'This is a simulated summary of the provided content. Key points include operational efficiency improvements and customer satisfaction metrics.';
    }

    if (content.toLowerCase().includes('question') || content.toLowerCase().includes('?')) {
      return 'Based on the available information, I recommend reviewing your current inventory levels and adjusting orders accordingly. Consider scheduling additional staff during peak hours on weekends.';
    }

    return 'This is a simulated response from the OpenRouter adapter. In production, this would be generated by a real LLM model based on the provided context and prompt.';
  }

  /**
   * Simulate embedding generation
   */
  private simulateEmbed(text: string): number[] {
    // Generate a deterministic pseudo-random embedding based on text hash
    const hash = this.hashCode(text);
    const embedding: number[] = [];
    
    for (let i = 0; i < 1536; i++) {
      // Use hash + index to generate pseudo-random values between -1 and 1
      const val = Math.sin(hash + i) * Math.cos(hash * i);
      embedding.push(val);
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

export const openRouterAdapter = new OpenRouterAdapter();
export default openRouterAdapter;
