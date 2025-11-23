/**
 * Unit tests for TransactionService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { TransactionService } from '../transaction-service';
import type { SuiTransactionBlockResponse, SuiEvent } from '@mysten/sui/client';

describe('TransactionService', () => {
  let service: TransactionService;
  let mockClient: SuiClient;

  beforeEach(() => {
    // Create a mock SuiClient
    mockClient = {} as SuiClient;
    service = new TransactionService(mockClient);
  });

  describe('buildCreateBountyTransaction', () => {
    it('should build a transaction with correct structure', () => {
      const params = {
        name: 'Test Bounty',
        fileNameList: ['file1.jpg', 'file2.jpg'],
        blobIds: ['blob1', 'blob2'],
        allowedLabels: ['cat', 'dog'],
        totalImages: 2,
        rewardAmount: 1000000000, // 1 SUI in MIST
      };

      const tx = service.buildCreateBountyTransaction(params);

      expect(tx).toBeInstanceOf(Transaction);
    });

    it('should handle empty arrays', () => {
      const params = {
        name: 'Empty Bounty',
        fileNameList: [],
        blobIds: [],
        allowedLabels: ['label1'],
        totalImages: 0,
        rewardAmount: 1000000,
      };

      const tx = service.buildCreateBountyTransaction(params);

      expect(tx).toBeInstanceOf(Transaction);
    });
  });

  describe('buildSubmitLabelTransaction', () => {
    it('should build a transaction with correct structure', () => {
      const params = {
        bountyObjectId: '0x123abc',
        fileName: 'file1.jpg',
        label: 'cat',
      };

      const tx = service.buildSubmitLabelTransaction(params);

      expect(tx).toBeInstanceOf(Transaction);
    });
  });

  describe('parseTransactionResponse', () => {
    it('should parse successful transaction with created object', () => {
      const mockResponse: SuiTransactionBlockResponse = {
        digest: 'test-digest-123',
        effects: {
          status: { status: 'success' },
          created: [
            {
              reference: {
                objectId: '0xbounty123',
                version: '1',
                digest: 'obj-digest',
              },
              owner: { AddressOwner: '0xowner' },
            },
          ],
        },
        events: [],
      } as any;

      const result = service.parseTransactionResponse(mockResponse);

      expect(result.success).toBe(true);
      expect(result.digest).toBe('test-digest-123');
      expect(result.objectId).toBe('0xbounty123');
    });

    it('should handle failed transaction', () => {
      const mockResponse: SuiTransactionBlockResponse = {
        digest: 'test-digest-456',
        effects: {
          status: {
            status: 'failure',
            error: 'Insufficient balance',
          },
        },
        events: [],
      } as any;

      const result = service.parseTransactionResponse(mockResponse);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });

    it('should handle missing effects', () => {
      const mockResponse: SuiTransactionBlockResponse = {
        digest: 'test-digest-789',
      } as any;

      const result = service.parseTransactionResponse(mockResponse);

      expect(result.success).toBe(false);
      expect(result.error).toContain('effects not available');
    });
  });

  describe('parseEvents', () => {
    it('should parse LabelFinalizedEvent correctly', () => {
      const mockEvents: SuiEvent[] = [
        {
          type: '0xpackage::datapact::LabelFinalizedEvent',
          parsedJson: {
            bounty_id: '0xbounty123',
            file_name: 'image1.jpg',
            final_label: 'cat',
          },
        } as any,
      ];

      const result = service.parseEvents(mockEvents);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('LabelFinalizedEvent');
      expect(result[0].bountyId).toBe('0xbounty123');
      expect(result[0].fileName).toBe('image1.jpg');
      expect(result[0].finalLabel).toBe('cat');
    });

    it('should handle camelCase event fields', () => {
      const mockEvents: SuiEvent[] = [
        {
          type: '0xpackage::datapact::LabelFinalizedEvent',
          parsedJson: {
            bountyId: '0xbounty456',
            fileName: 'image2.jpg',
            finalLabel: 'dog',
          },
        } as any,
      ];

      const result = service.parseEvents(mockEvents);

      expect(result).toHaveLength(1);
      expect(result[0].bountyId).toBe('0xbounty456');
      expect(result[0].fileName).toBe('image2.jpg');
      expect(result[0].finalLabel).toBe('dog');
    });

    it('should filter out non-LabelFinalizedEvent events', () => {
      const mockEvents: SuiEvent[] = [
        {
          type: '0xpackage::datapact::OtherEvent',
          parsedJson: { data: 'test' },
        } as any,
        {
          type: '0xpackage::datapact::LabelFinalizedEvent',
          parsedJson: {
            bounty_id: '0xbounty789',
            file_name: 'image3.jpg',
            final_label: 'bird',
          },
        } as any,
      ];

      const result = service.parseEvents(mockEvents);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('LabelFinalizedEvent');
    });

    it('should return empty array for no events', () => {
      const result = service.parseEvents([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('splitCoin', () => {
    it('should split coin from gas', () => {
      const tx = new Transaction();
      const amount = 1000000000;

      const coin = service.splitCoin(tx, amount);

      expect(coin).toBeDefined();
    });
  });
});
