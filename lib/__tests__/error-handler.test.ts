import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseWalletError,
  parseTransactionError,
  parseNetworkError,
  retryWithBackoff,
  ErrorType,
} from '../error-handler';

describe('Error Handler', () => {
  describe('parseWalletError', () => {
    it('should parse user rejection error', () => {
      const error = new Error('User rejected the connection');
      const result = parseWalletError(error);

      expect(result.type).toBe(ErrorType.WALLET_REJECTED);
      expect(result.userMessage).toContain('rejected');
      expect(result.canRetry).toBe(true);
    });

    it('should parse wallet not installed error', () => {
      const error = new Error('Wallet not installed');
      const result = parseWalletError(error);

      expect(result.type).toBe(ErrorType.WALLET_NOT_INSTALLED);
      expect(result.userMessage).toContain('install');
      expect(result.canRetry).toBe(false);
    });

    it('should parse network mismatch error', () => {
      const error = new Error('Wrong network detected');
      const result = parseWalletError(error);

      expect(result.type).toBe(ErrorType.WALLET_CONNECTION);
      expect(result.userMessage).toContain('Testnet');
      expect(result.canRetry).toBe(true);
    });

    it('should handle generic wallet error', () => {
      const error = new Error('Unknown wallet error');
      const result = parseWalletError(error);

      expect(result.type).toBe(ErrorType.WALLET_CONNECTION);
      expect(result.canRetry).toBe(true);
    });
  });

  describe('parseTransactionError', () => {
    it('should parse insufficient balance error', () => {
      const error = new Error('Insufficient balance for transaction');
      const result = parseTransactionError(error);

      expect(result.type).toBe(ErrorType.INSUFFICIENT_BALANCE);
      expect(result.userMessage).toContain('Insufficient balance');
      expect(result.canRetry).toBe(false);
    });

    it('should parse invalid object error', () => {
      const error = new Error('Object not found');
      const result = parseTransactionError(error);

      expect(result.type).toBe(ErrorType.INVALID_OBJECT);
      expect(result.userMessage).toContain('Invalid');
      expect(result.canRetry).toBe(false);
    });

    it('should parse contract execution error', () => {
      const error = new Error('Contract execution failed');
      const result = parseTransactionError(error);

      expect(result.type).toBe(ErrorType.CONTRACT_ERROR);
      expect(result.userMessage).toContain('contract');
      expect(result.canRetry).toBe(true);
    });

    it('should parse user rejection error', () => {
      const error = new Error('Transaction rejected by user');
      const result = parseTransactionError(error);

      expect(result.type).toBe(ErrorType.WALLET_REJECTED);
      expect(result.userMessage).toContain('rejected');
      expect(result.canRetry).toBe(true);
    });

    it('should parse network error', () => {
      const error = new Error('Network timeout occurred');
      const result = parseTransactionError(error);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.userMessage).toContain('Network');
      expect(result.canRetry).toBe(true);
    });
  });

  describe('parseNetworkError', () => {
    it('should parse RPC unavailable error', () => {
      const error = new Error('Service unavailable (503)');
      const result = parseNetworkError(error);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.userMessage).toContain('unavailable');
      expect(result.canRetry).toBe(true);
    });

    it('should parse timeout error', () => {
      const error = new Error('Request timed out');
      const result = parseNetworkError(error);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.userMessage).toContain('timed out');
      expect(result.canRetry).toBe(true);
    });

    it('should parse rate limit error', () => {
      const error = new Error('Rate limit exceeded (429)');
      const result = parseNetworkError(error);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.userMessage).toContain('Too many requests');
      expect(result.canRetry).toBe(true);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxAttempts: 3 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network timeout'));

      const promise = retryWithBackoff(fn, { maxAttempts: 2, initialDelay: 100 });
      
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('Network timeout');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Insufficient balance'));

      const promise = retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 100 });
      
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('Insufficient balance');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
