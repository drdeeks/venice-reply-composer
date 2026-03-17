import { ethers } from 'ethers';
import { MeritAttestation, MeritAttestationResponse } from './types';

// Fallback to mock if real SDK not available
let MeritSystemsClient: any;

try {
  // Try to import the real Merit Systems SDK if available
  MeritSystemsClient = require('@merit/systems-sdk');
  console.log('✅ Using real Merit Systems SDK');
} catch (_error) {
  // Fall back to our own implementation if real SDK is not installed
  console.warn('⚠️  Real Merit Systems SDK not available, falling back to mock implementation');
  
  // Define the mock class with the same interface
  class MockMeritSystemsClient {
    private readonly apiBaseUrl: string;
    private readonly apiKey?: string;
    private readonly contractAddress: string;

    constructor(apiBaseUrl: string, contractAddress: string, apiKey?: string) {
      this.apiBaseUrl = apiBaseUrl;
      this.apiKey = apiKey;
      this.contractAddress = contractAddress;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      const url = `${this.apiBaseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        ...options.headers as Record<string, string>
      };

      // Mock response for testing
      const mockResponse: any = {
        status: 200,
        data: [{
          id: 'mock-attest-1',
          issuer: '0x123',
          recipient: '0x456',
          data: { type: 'builder-score', value: 95 },
          signature: 'mock-signature',
          issuedAt: Date.now(),
          revoked: false
        }]
      };

      return mockResponse as T;
    }

    async getAttestationsByAddress(address: string): Promise<MeritAttestation[]> {
      try {
        const data = await this.request<MeritAttestationResponse[]>(`/attestations/address/${address.toLowerCase()}`);
        return Array.isArray(data) ? data.map((attestation: any) => ({
          id: attestation.id,
          issuer: attestation.issuer,
          recipient: attestation.recipient,
          data: attestation.data,
          signature: attestation.signature,
          issuedAt: attestation.issuedAt,
          revoked: attestation.revoked
        })) : [];
      } catch (error) {
        console.error('Merit Systems API call failed (mock)', error);
        return [];
      }
    }

    async getAttestationsByIds(ids: string[]): Promise<MeritAttestation[]> {
      try {
        const data = await this.request<MeritAttestationResponse[]>(`/attestations/ids`, {
          method: 'POST',
          body: JSON.stringify({ ids })
        });
        return Array.isArray(data) ? data.map((attestation: any) => ({
          id: attestation.id,
          issuer: attestation.issuer,
          recipient: attestation.recipient,
          data: attestation.data,
          signature: attestation.signature,
          issuedAt: attestation.issuedAt,
          revoked: attestation.revoked
        })) : [];
      } catch (error) {
        console.error('Merit Systems API call failed (mock)', error);
        return [];
      }
    }

    async getAttestationsByIssuer(issuer: string): Promise<MeritAttestation[]> {
      try {
        const data = await this.request<MeritAttestationResponse[]>(`/attestations/issuer/${issuer.toLowerCase()}`);
        return Array.isArray(data) ? data.map((attestation: any) => ({
          id: attestation.id,
          issuer: attestation.issuer,
          recipient: attestation.recipient,
          data: attestation.data,
          signature: attestation.signature,
          issuedAt: attestation.issuedAt,
          revoked: attestation.revoked
        })) : [];
      } catch (error) {
        console.error('Merit Systems API call failed (mock)', error);
        return [];
      }
    }

    async getAttestationsByRecipient(recipient: string): Promise<MeritAttestation[]> {
      try {
        const data = await this.request<MeritAttestationResponse[]>(`/attestations/recipient/${recipient.toLowerCase()}`);
        return Array.isArray(data) ? data.map((attestation: any) => ({
          id: attestation.id,
          issuer: attestation.issuer,
          recipient: attestation.recipient,
          data: attestation.data,
          signature: attestation.signature,
          issuedAt: attestation.issuedAt,
          revoked: attestation.revoked
        })) : [];
      } catch (error) {
        console.error('Merit Systems API call failed (mock)', error);
        return [];
      }
    }

    async verifyAttestation(attestationId: string): Promise<{
      valid: boolean;
      reason?: string;
      data?: any;
    }> {
      try {
        const data = await this.request<any>(`/attestations/${attestationId}/verify`);
        return {
          valid: data.valid,
          reason: data.reason,
          data: data.data
        };
      } catch (error) {
        console.error('Merit Systems verify failed (mock)', error);
        return {
          valid: false,
          reason: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    async getAttestationStats(address: string): Promise<{
      total: number;
      active: number;
      revoked: number;
      byType: Record<string, number>;
      recent: MeritAttestation[];
    }> {
      try {
        const data = await this.request<any>(`/attestations/${address.toLowerCase()}/stats`);
        return {
          total: data.total || 0,
          active: data.active || 0,
          revoked: data.revoked || 0,
          byType: data.byType || {},
          recent: Array.isArray(data.recent) ? data.recent.map((attestation: any) => ({
            id: attestation.id,
            issuer: attestation.issuer,
            recipient: attestation.recipient,
            data: attestation.data,
            signature: attestation.signature,
            issuedAt: attestation.issuedAt,
            revoked: attestation.revoked
          })) : []
        };
      } catch (error) {
        console.error('Merit Systems stats failed (mock)', error);
        return {
          total: 0,
          active: 0,
          revoked: 0,
          byType: {},
          recent: []
        };
      }
    }

    async getAttestationsByType(type: string, address?: string): Promise<MeritAttestation[]> {
      try {
        const params = address ? `?address=${address.toLowerCase()}` : '';
        const data = await this.request<MeritAttestationResponse[]>(`/attestations/type/${encodeURIComponent(type)}${params}`);
        return Array.isArray(data) ? data.map((attestation: any) => ({
          id: attestation.id,
          issuer: attestation.issuer,
          recipient: attestation.recipient,
          data: attestation.data,
          signature: attestation.signature,
          issuedAt: attestation.issuedAt,
          revoked: attestation.revoked
        })) : [];
      } catch (error) {
        console.error('Merit Systems by type failed (mock)', error);
        return [];
      }
    }

    async getAttestationsByTimeRange(
      startTime: number,
      endTime: number,
      address?: string
    ): Promise<MeritAttestation[]> {
      try {
        const params = address ? `&address=${address.toLowerCase()}` : '';
        const data = await this.request<MeritAttestationResponse[]>(`/attestations/time-range?start=${startTime}&end=${endTime}${params}`);
        return Array.isArray(data) ? data.map((attestation: any) => ({
          id: attestation.id,
          issuer: attestation.issuer,
          recipient: attestation.recipient,
          data: attestation.data,
          signature: attestation.signature,
          issuedAt: attestation.issuedAt,
          revoked: attestation.revoked
        })) : [];
      } catch (error) {
        console.error('Merit Systems time range failed (mock)', error);
        return [];
      }
    }

    async searchAttestations(
      query: Record<string, any>,
      address?: string
    ): Promise<MeritAttestation[]> {
      try {
        const body = JSON.stringify({ query, address });
        const data = await this.request<MeritAttestationResponse[]>('/attestations/search', {
          method: 'POST',
          body
        });
        return Array.isArray(data) ? data.map((attestation: any) => ({
          id: attestation.id,
          issuer: attestation.issuer,
          recipient: attestation.recipient,
          data: attestation.data,
          signature: attestation.signature,
          issuedAt: attestation.issuedAt,
          revoked: attestation.revoked
        })) : [];
      } catch (error) {
        console.error('Merit Systems search failed (mock)', error);
        return [];
      }
    }
  }

  MeritSystemsClient = MockMeritSystemsClient;
}

export { MeritSystemsClient };