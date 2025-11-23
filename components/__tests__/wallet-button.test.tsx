import { describe, it, expect } from 'vitest';
import { truncateAddress } from '../wallet-button';

describe('WalletButton', () => {
  describe('truncateAddress', () => {
    it('should truncate long addresses correctly', () => {
      const address = '0x1234567890abcdef1234567890abcdef1234567890abcdef';
      const truncated = truncateAddress(address);
      expect(truncated).toBe('0x1234...cdef');
    });

    it('should not truncate short addresses', () => {
      const address = '0x12345678';
      const truncated = truncateAddress(address);
      expect(truncated).toBe(address);
    });

    it('should handle custom start and end character counts', () => {
      const address = '0x1234567890abcdef1234567890abcdef';
      const truncated = truncateAddress(address, 4, 6);
      expect(truncated).toBe('0x12...abcdef');
    });
  });
});
