/**
 * Neynar API Client
 * 
 * Integrates with Neynar's Farcaster API for trending casts and social data.
 * API Docs: https://docs.neynar.com/reference/fetch-trending-feed
 */

import { NEYNAR_API } from './storage';

// ============================================================================
// Types
// ============================================================================

export type TimeWindow = '1h' | '6h' | '12h' | '24h' | '7d';

export interface Author {
  object: 'user';
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  custody_address?: string;
  follower_count?: number;
  following_count?: number;
  power_badge?: boolean;
  profile?: {
    bio?: {
      text?: string;
    };
  };
}

export interface Channel {
  object: 'channel_dehydrated' | 'channel';
  id: string;
  name: string;
  image_url?: string;
}

export interface Embed {
  url?: string;
  metadata?: {
    content_type?: string;
    image?: {
      width_px?: number;
      height_px?: number;
    };
  };
}

export interface Cast {
  object: 'cast';
  hash: string;
  author: Author;
  text: string;
  timestamp: string;
  embeds: Embed[];
  channel: Channel | null;
  parent_hash: string | null;
  parent_url: string | null;
  reactions: {
    likes_count: number;
    recasts_count: number;
    likes?: Array<{ fid: number; fname: string }>;
    recasts?: Array<{ fid: number; fname: string }>;
  };
  replies: {
    count: number;
  };
  mentioned_profiles: Author[];
  thread_hash: string | null;
}

export interface TrendingFeedResponse {
  casts: Cast[];
  next: {
    cursor: string | null;
  };
}

export interface TrendingFeedOptions {
  limit?: number;
  cursor?: string;
  viewerFid?: number;
  timeWindow?: TimeWindow;
  channelId?: string;
  parentUrl?: string;
}

export interface NeynarApiError {
  code?: string;
  message: string;
  status?: number;
}

// ============================================================================
// Trending Analysis
// ============================================================================

export interface TrendingTopic {
  term: string;
  count: number;
  type: 'hashtag' | 'cashtag' | 'mention' | 'keyword';
}

export interface TrendingToken {
  symbol: string;
  mentions: number;
  casts: Cast[];
}

export interface TrendingAnalysis {
  topics: TrendingTopic[];
  tokens: TrendingToken[];
  topAuthors: Author[];
  totalEngagement: number;
}

// ============================================================================
// API Client
// ============================================================================

export class NeynarApiClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = NEYNAR_API.baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'api_key': this.apiKey,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as NeynarApiError;
      throw new NeynarError(
        error.message || `API error: ${response.status}`,
        response.status,
        error
      );
    }

    return data as T;
  }

  /**
   * Fetch trending casts from Farcaster
   */
  async fetchTrendingFeed(options: TrendingFeedOptions = {}): Promise<TrendingFeedResponse> {
    const params = new URLSearchParams();
    
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.viewerFid) params.set('viewer_fid', options.viewerFid.toString());
    if (options.timeWindow) params.set('time_window', options.timeWindow);
    if (options.channelId) params.set('channel_id', options.channelId);
    if (options.parentUrl) params.set('parent_url', options.parentUrl);

    const queryString = params.toString();
    const endpoint = `${NEYNAR_API.endpoints.trending}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<TrendingFeedResponse>(endpoint);
  }

  /**
   * Fetch multiple pages of trending casts
   */
  async fetchTrendingFeedAll(
    options: TrendingFeedOptions & { maxPages?: number } = {}
  ): Promise<Cast[]> {
    const { maxPages = 3, ...feedOptions } = options;
    const allCasts: Cast[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < maxPages; page++) {
      const response = await this.fetchTrendingFeed({
        ...feedOptions,
        cursor: cursor || undefined,
        limit: feedOptions.limit || 10
      });

      allCasts.push(...response.casts);
      cursor = response.next.cursor;

      if (!cursor) break;
    }

    return allCasts;
  }

  /**
   * Analyze trending casts for topics and tokens
   */
  analyzeTrending(casts: Cast[]): TrendingAnalysis {
    const topicMap = new Map<string, { count: number; type: TrendingTopic['type'] }>();
    const tokenMap = new Map<string, { mentions: number; casts: Cast[] }>();
    const authorEngagement = new Map<number, { author: Author; engagement: number }>();
    let totalEngagement = 0;

    for (const cast of casts) {
      const engagement = cast.reactions.likes_count + cast.reactions.recasts_count + cast.replies.count;
      totalEngagement += engagement;

      // Track author engagement
      const authorKey = cast.author.fid;
      const existing = authorEngagement.get(authorKey);
      if (existing) {
        existing.engagement += engagement;
      } else {
        authorEngagement.set(authorKey, { author: cast.author, engagement });
      }

      // Extract hashtags
      const hashtags = cast.text.match(/#[A-Za-z][A-Za-z0-9_]*/g) || [];
      for (const tag of hashtags) {
        const key = tag.toLowerCase();
        const entry = topicMap.get(key);
        if (entry) {
          entry.count++;
        } else {
          topicMap.set(key, { count: 1, type: 'hashtag' });
        }
      }

      // Extract cashtags (tokens)
      const cashtags = cast.text.match(/\$[A-Za-z][A-Za-z0-9]*/g) || [];
      for (const tag of cashtags) {
        const symbol = tag.substring(1).toUpperCase();
        const entry = tokenMap.get(symbol);
        if (entry) {
          entry.mentions++;
          entry.casts.push(cast);
        } else {
          tokenMap.set(symbol, { mentions: 1, casts: [cast] });
        }
        
        // Also add to topics
        const topicKey = tag.toLowerCase();
        const topicEntry = topicMap.get(topicKey);
        if (topicEntry) {
          topicEntry.count++;
        } else {
          topicMap.set(topicKey, { count: 1, type: 'cashtag' });
        }
      }

      // Extract mentions
      for (const profile of cast.mentioned_profiles) {
        const key = `@${profile.username}`;
        const entry = topicMap.get(key);
        if (entry) {
          entry.count++;
        } else {
          topicMap.set(key, { count: 1, type: 'mention' });
        }
      }
    }

    // Convert maps to sorted arrays
    const topics: TrendingTopic[] = Array.from(topicMap.entries())
      .map(([term, data]) => ({ term, count: data.count, type: data.type }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const tokens: TrendingToken[] = Array.from(tokenMap.entries())
      .map(([symbol, data]) => ({ symbol, mentions: data.mentions, casts: data.casts }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);

    const topAuthors: Author[] = Array.from(authorEngagement.values())
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10)
      .map(e => e.author);

    return { topics, tokens, topAuthors, totalEngagement };
  }

  /**
   * Get trending context string for AI prompts
   */
  async getTrendingContext(options: TrendingFeedOptions = {}): Promise<string> {
    try {
      const casts = await this.fetchTrendingFeedAll({ ...options, maxPages: 2 });
      const analysis = this.analyzeTrending(casts);

      const lines: string[] = ['[Trending on Farcaster]'];

      if (analysis.tokens.length > 0) {
        const tokenStr = analysis.tokens
          .slice(0, 5)
          .map(t => `$${t.symbol} (${t.mentions} mentions)`)
          .join(', ');
        lines.push(`Trending tokens: ${tokenStr}`);
      }

      if (analysis.topics.length > 0) {
        const topicStr = analysis.topics
          .filter(t => t.type === 'hashtag')
          .slice(0, 5)
          .map(t => t.term)
          .join(', ');
        if (topicStr) {
          lines.push(`Trending topics: ${topicStr}`);
        }
      }

      return lines.join('\n');
    } catch (error) {
      console.error('Failed to fetch trending context:', error);
      return '';
    }
  }
}

// ============================================================================
// Error Class
// ============================================================================

export class NeynarError extends Error {
  status: number;
  details: NeynarApiError;

  constructor(message: string, status: number, details: NeynarApiError) {
    super(message);
    this.name = 'NeynarError';
    this.status = status;
    this.details = details;
  }

  isRateLimit(): boolean {
    return this.status === 429;
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

// ============================================================================
// Singleton helper
// ============================================================================

let clientInstance: NeynarApiClient | null = null;

export function getNeynarClient(apiKey: string): NeynarApiClient {
  if (!clientInstance || (clientInstance as any).apiKey !== apiKey) {
    clientInstance = new NeynarApiClient(apiKey);
  }
  return clientInstance;
}

export function clearNeynarClient(): void {
  clientInstance = null;
}
