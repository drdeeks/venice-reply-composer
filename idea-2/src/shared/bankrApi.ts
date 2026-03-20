/**
 * Bankr Agent API Client
 * 
 * Integrates with Bankr's Agent API for executing trades via natural language prompts.
 * API Docs: https://docs.bankr.bot/agent-api/overview.md
 */

import { BANKR_API } from './storage';

// ============================================================================
// Types
// ============================================================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PromptResponse {
  success: boolean;
  jobId: string;
  threadId: string;
  status: JobStatus;
  message: string;
}

export interface Transaction {
  type: string;
  hash?: string;
  chain?: string;
  status?: string;
  amount?: string;
  token?: string;
  tokenOut?: string;
  amountOut?: string;
}

export interface JobResponse {
  success: boolean;
  jobId: string;
  status: JobStatus;
  prompt?: string;
  response?: string;
  transactions?: Transaction[];
  createdAt?: string;
  completedAt?: string;
  processingTime?: number;
  error?: string;
}

export interface UserInfo {
  success: boolean;
  wallets?: {
    ethereum?: string;
    solana?: string;
    [chain: string]: string | undefined;
  };
  bankrClub?: boolean;
  socials?: {
    twitter?: string;
    farcaster?: string;
  };
}

export interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  balanceUsd?: string;
  chain: string;
}

export interface BalancesResponse {
  success: boolean;
  balances: TokenBalance[];
}

export interface BankrApiError {
  error: string;
  message: string;
  resetAt?: number;
  limit?: number;
  used?: number;
}

// ============================================================================
// API Client
// ============================================================================

export class BankrApiClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = BANKR_API.baseURL;
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
        'X-API-Key': this.apiKey,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as BankrApiError;
      throw new BankrError(
        error.message || `API error: ${response.status}`,
        response.status,
        error
      );
    }

    return data as T;
  }

  /**
   * Submit a natural language prompt to the Bankr AI agent
   */
  async submitPrompt(prompt: string, threadId?: string): Promise<PromptResponse> {
    const body: { prompt: string; threadId?: string } = { prompt };
    if (threadId) {
      body.threadId = threadId;
    }

    return this.request<PromptResponse>(BANKR_API.endpoints.prompt, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * Get the status and result of a job
   */
  async getJob(jobId: string): Promise<JobResponse> {
    return this.request<JobResponse>(`${BANKR_API.endpoints.job}/${jobId}`);
  }

  /**
   * Poll a job until it completes or times out
   */
  async pollJob(
    jobId: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (job: JobResponse) => void;
    } = {}
  ): Promise<JobResponse> {
    const { maxAttempts = 30, intervalMs = 5000, onProgress } = options;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const job = await this.getJob(jobId);
      
      if (onProgress) {
        onProgress(job);
      }

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        return job;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new BankrError('Job polling timed out', 408, { error: 'timeout', message: 'Job did not complete in time' });
  }

  /**
   * Get user info including wallets and Bankr Club status
   */
  async getUserInfo(): Promise<UserInfo> {
    return this.request<UserInfo>(BANKR_API.endpoints.userInfo);
  }

  /**
   * Get token balances across all supported chains
   */
  async getBalances(chain?: string): Promise<BalancesResponse> {
    const endpoint = chain
      ? `${BANKR_API.endpoints.balances}?chain=${chain}`
      : BANKR_API.endpoints.balances;
    return this.request<BalancesResponse>(endpoint);
  }

  /**
   * Execute a token swap via natural language
   */
  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amount: string,
    chain: string = 'base'
  ): Promise<JobResponse> {
    const prompt = `swap ${amount} of ${tokenIn} to ${tokenOut} on ${chain}`;
    const submitResponse = await this.submitPrompt(prompt);
    return this.pollJob(submitResponse.jobId);
  }

  /**
   * Get price of a token
   */
  async getPrice(token: string): Promise<JobResponse> {
    const prompt = `what is the price of ${token}?`;
    const submitResponse = await this.submitPrompt(prompt);
    return this.pollJob(submitResponse.jobId);
  }
}

// ============================================================================
// Error Class
// ============================================================================

export class BankrError extends Error {
  status: number;
  details: BankrApiError;

  constructor(message: string, status: number, details: BankrApiError) {
    super(message);
    this.name = 'BankrError';
    this.status = status;
    this.details = details;
  }

  isRateLimit(): boolean {
    return this.status === 429;
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  getResetTime(): Date | null {
    if (this.details.resetAt) {
      return new Date(this.details.resetAt);
    }
    return null;
  }
}

// ============================================================================
// Singleton helper for content script usage
// ============================================================================

let clientInstance: BankrApiClient | null = null;

export function getBankrClient(apiKey: string): BankrApiClient {
  if (!clientInstance || (clientInstance as any).apiKey !== apiKey) {
    clientInstance = new BankrApiClient(apiKey);
  }
  return clientInstance;
}

export function clearBankrClient(): void {
  clientInstance = null;
}
