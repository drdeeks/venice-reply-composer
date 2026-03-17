import { MeritSystemsClient } from '../src/merit-systems';
import { TalentProtocolClient } from '../src/talent-protocol';

describe('Builder Credential ENS', () => {
  describe('MeritSystemsClient', () => {
    let client: any;

    beforeEach(() => {
      client = new MeritSystemsClient('https://mock-api.merit.io', '0x123');
    });

    it('should be instantiable', () => {
      expect(client).toBeDefined();
    });

    it('should get attestations by address', async () => {
      const attestations = await client.getAttestationsByAddress('0xabc');
      expect(Array.isArray(attestations)).toBe(true);
    });

    it('should verify attestation', async () => {
      const result = await client.verifyAttestation('attestation-1');
      expect(result).toHaveProperty('valid');
    });

    it('should get attestation stats', async () => {
      const stats = await client.getAttestationStats('0xabc');
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
    });
  });

  describe('TalentProtocolClient', () => {
    let client: any;

    beforeEach(() => {
      client = new TalentProtocolClient('https://mock-api.talentprotocol.com');
    });

    it('should be instantiable', () => {
      expect(client).toBeDefined();
    });

    it('should get profile by address', async () => {
      const profile = await client.getProfileByAddress('0xabc');
      expect(profile).toBeDefined();
    });

    it('should get reputation', async () => {
      const reputation = await client.getReputation('0xabc');
      expect(reputation).toBeDefined();
    });
  });
});