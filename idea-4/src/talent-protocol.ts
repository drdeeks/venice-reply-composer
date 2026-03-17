import { ethers } from 'ethers';
import { TalentProfile, TalentAchievement, TalentProfileResponse } from './types';

// Fallback to mock if real SDK not available
let TalentProtocolClient: any;

try {
  TalentProtocolClient = require('@talent/protocol-sdk');
  console.log('✅ Using real Talent Protocol SDK');
} catch (_error) {
  console.warn('⚠️  Real Talent Protocol SDK not available, falling back to mock implementation');
  
  class MockTalentProtocolClient {
    private readonly apiBaseUrl: string;
    private readonly apiKey?: string;

    constructor(apiBaseUrl: string, apiKey?: string) {
      this.apiBaseUrl = apiBaseUrl;
      this.apiKey = apiKey;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      const url = `${this.apiBaseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        ...(options.headers as Record<string, string>)
      };

      // Mock response
      const mockResponse: any = {
        id: 'mock-profile-1',
        address: '0x123',
        score: 95,
        rank: 5,
        skills: ['smart-contract', 'web3', 'solidity'],
        achievements: [{
          id: 'mock-ach-1',
          type: 'bounty-completion',
          title: 'Bankr Integration Bounty',
          description: 'Successfully integrated Bankr SDK into a web3 app',
          timestamp: Date.now(),
          proof: 'https://example.com/proof'
        }]
      };
      return mockResponse as T;
    }

    async getProfileByAddress(address: string): Promise<TalentProfile | null> {
      try {
        const data = await this.request<TalentProfileResponse>(`/profiles/by-address/${address.toLowerCase()}`);
        return {
          id: data.id,
          address: data.address,
          score: data.score,
          rank: data.rank,
          skills: data.skills || [],
          achievements: (data.achievements || []).map((a: any) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            description: a.description,
            timestamp: a.timestamp,
            proof: a.proof
          }))
        };
      } catch (error) {
        if ((error as any)?.message?.includes('404')) return null;
        console.error('Talent Protocol API call failed (mock)', error);
        return null;
      }
    }

    async getProfileById(profileId: string): Promise<TalentProfile | null> {
      try {
        const data = await this.request<TalentProfileResponse>(`/profiles/${profileId}`);
        return {
          id: data.id,
          address: data.address,
          score: data.score,
          rank: data.rank,
          skills: data.skills || [],
          achievements: (data.achievements || []).map((a: any) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            description: a.description,
            timestamp: a.timestamp,
            proof: a.proof
          }))
        };
      } catch (error) {
        if ((error as any)?.message?.includes('404')) return null;
        console.error('Talent Protocol API call failed (mock)', error);
        return null;
      }
    }

    async getTopBuilders(limit: number = 100): Promise<TalentProfile[]> {
      try {
        const data = await this.request<TalentProfileResponse[]>(`/profiles/top?limit=${limit}`);
        return (data || []).map((profile: any) => ({
          id: profile.id,
          address: profile.address,
          score: profile.score,
          rank: profile.rank,
          skills: profile.skills || [],
          achievements: (profile.achievements || []).map((a: any) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            description: a.description,
            timestamp: a.timestamp,
            proof: a.proof
          }))
        }));
      } catch (error) {
        console.error('Talent Protocol API call failed (mock)', error);
        return [];
      }
    }

    async searchBuildersBySkill(skill: string, limit: number = 50): Promise<TalentProfile[]> {
      try {
        const data = await this.request<TalentProfileResponse[]>(`/profiles/search?skill=${encodeURIComponent(skill)}&limit=${limit}`);
        return (data || []).map((profile: any) => ({
          id: profile.id,
          address: profile.address,
          score: profile.score,
          rank: profile.rank,
          skills: profile.skills || [],
          achievements: (profile.achievements || []).map((a: any) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            description: a.description,
            timestamp: a.timestamp,
            proof: a.proof
          }))
        }));
      } catch (error) {
        console.error('Talent Protocol API call failed (mock)', error);
        return [];
      }
    }

    async getReputation(address: string): Promise<{ score: number; rank: number; percentile: number; totalBuilders: number } | null> {
      try {
        const data = await this.request<any>(`/reputation/${address.toLowerCase()}`);
        return {
          score: data.score,
          rank: data.rank,
          percentile: data.percentile,
          totalBuilders: data.totalBuilders
        };
      } catch (error) {
        if ((error as any)?.message?.includes('404')) return null;
        console.error('Talent Protocol reputation failed (mock)', error);
        return null;
      }
    }

    async getRecentAchievements(address: string, limit: number = 10): Promise<TalentAchievement[]> {
      try {
        const data = await this.request<any>(`/achievements/${address.toLowerCase()}?limit=${limit}`);
        return (data || []).map((a: any) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          timestamp: a.timestamp,
          proof: a.proof
        }));
      } catch (error) {
        if ((error as any)?.message?.includes('404')) return [];
        console.error('Talent Protocol achievements failed (mock)', error);
        return [];
      }
    }
  }

  TalentProtocolClient = MockTalentProtocolClient;
}

export { TalentProtocolClient };