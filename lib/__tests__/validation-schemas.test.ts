/**
 * Unit tests for validation schemas
 * 
 * Tests validation rules for:
 * - Create bounty form (Requirements 5.1, 5.2, 5.3, 5.4, 5.5)
 * - Submit label form
 */

import { describe, it, expect } from 'vitest';
import { createBountySchema, submitLabelSchema } from '../validation-schemas';

describe('createBountySchema', () => {
  describe('name validation (Requirement 5.1)', () => {
    it('should accept valid bounty name', () => {
      const validData = {
        name: 'Valid Bounty Name',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty bounty name', () => {
      const invalidData = {
        name: '',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bounty name is required');
      }
    });

    it('should reject whitespace-only bounty name', () => {
      const invalidData = {
        name: '   ',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bounty name cannot be only whitespace');
      }
    });
  });

  describe('list length validation (Requirement 5.2)', () => {
    it('should accept matching file names and blob IDs lengths', () => {
      const validData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg', 'file2.jpg', 'file3.jpg'],
        blobIds: ['blob1', 'blob2', 'blob3'],
        allowedLabels: ['cat'],
        totalImages: 3,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched file names and blob IDs lengths', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg', 'file2.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 2,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const lengthError = result.error.issues.find(
          issue => issue.message === 'File names and blob IDs must have the same length'
        );
        expect(lengthError).toBeDefined();
      }
    });

    it('should reject when file names is longer than blob IDs', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg', 'file2.jpg', 'file3.jpg'],
        blobIds: ['blob1', 'blob2'],
        allowedLabels: ['cat'],
        totalImages: 3,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('reward amount validation (Requirement 5.3)', () => {
    it('should accept positive reward amount', () => {
      const validData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 1000,
      };

      const result = createBountySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero reward amount', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 0,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Reward amount must be a positive number');
      }
    });

    it('should reject negative reward amount', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: -100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Reward amount must be a positive number');
      }
    });

    it('should accept decimal reward amount', () => {
      const validData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 99.99,
      };

      const result = createBountySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('total images validation (Requirement 5.4)', () => {
    it('should accept positive integer for total images', () => {
      const validData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 100,
        rewardAmount: 1000,
      };

      const result = createBountySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero total images', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 0,
        rewardAmount: 1000,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Total images must be a positive number');
      }
    });

    it('should reject negative total images', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: -5,
        rewardAmount: 1000,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Total images must be a positive number');
      }
    });

    it('should reject decimal total images', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 5.5,
        rewardAmount: 1000,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Total images must be an integer');
      }
    });
  });

  describe('validation error messages (Requirement 5.5)', () => {
    it('should provide specific error messages for multiple validation failures', () => {
      const invalidData = {
        name: '',
        fileNames: ['file1.jpg', 'file2.jpg'],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: -1,
        rewardAmount: 0,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        // Should have multiple errors
        expect(result.error.issues.length).toBeGreaterThan(1);
        
        // Check that each error has a specific message
        const errorMessages = result.error.issues.map(issue => issue.message);
        expect(errorMessages).toContain('Bounty name is required');
        expect(errorMessages).toContain('Total images must be a positive number');
        expect(errorMessages).toContain('Reward amount must be a positive number');
      }
    });

    it('should provide error message for empty file name', () => {
      const invalidData = {
        name: 'Test',
        fileNames: [''],
        blobIds: ['blob1'],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fileNameError = result.error.issues.find(
          issue => issue.message === 'File name cannot be empty'
        );
        expect(fileNameError).toBeDefined();
      }
    });

    it('should provide error message for empty blob ID', () => {
      const invalidData = {
        name: 'Test',
        fileNames: ['file1.jpg'],
        blobIds: [''],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const blobIdError = result.error.issues.find(
          issue => issue.message === 'Blob ID cannot be empty'
        );
        expect(blobIdError).toBeDefined();
      }
    });

    it('should provide error message for empty label', () => {
      const invalidData = {
        name: 'Test',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: [''],
        totalImages: 1,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const labelError = result.error.issues.find(
          issue => issue.message === 'Label cannot be empty'
        );
        expect(labelError).toBeDefined();
      }
    });
  });

  describe('array validation', () => {
    it('should require at least one file', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: [],
        blobIds: [],
        allowedLabels: ['cat'],
        totalImages: 1,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fileError = result.error.issues.find(
          issue => issue.message === 'At least one file is required'
        );
        expect(fileError).toBeDefined();
      }
    });

    it('should require at least one allowed label', () => {
      const invalidData = {
        name: 'Test Bounty',
        fileNames: ['file1.jpg'],
        blobIds: ['blob1'],
        allowedLabels: [],
        totalImages: 1,
        rewardAmount: 100,
      };

      const result = createBountySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const labelError = result.error.issues.find(
          issue => issue.message === 'At least one allowed label is required'
        );
        expect(labelError).toBeDefined();
      }
    });
  });
});

describe('submitLabelSchema', () => {
  describe('bounty object ID validation', () => {
    it('should accept valid Sui object ID', () => {
      const validData = {
        bountyObjectId: '0x123abc456def',
        fileName: 'image1.jpg',
        label: 'cat',
      };

      const result = submitLabelSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept long Sui object ID', () => {
      const validData = {
        bountyObjectId: '0x' + 'a'.repeat(64),
        fileName: 'image1.jpg',
        label: 'cat',
      };

      const result = submitLabelSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty object ID', () => {
      const invalidData = {
        bountyObjectId: '',
        fileName: 'image1.jpg',
        label: 'cat',
      };

      const result = submitLabelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bounty object ID is required');
      }
    });

    it('should reject object ID without 0x prefix', () => {
      const invalidData = {
        bountyObjectId: '123abc456def',
        fileName: 'image1.jpg',
        label: 'cat',
      };

      const result = submitLabelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid Sui object ID');
      }
    });

    it('should reject object ID with invalid characters', () => {
      const invalidData = {
        bountyObjectId: '0xGHIJKL',
        fileName: 'image1.jpg',
        label: 'cat',
      };

      const result = submitLabelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid Sui object ID');
      }
    });
  });

  describe('file name validation', () => {
    it('should accept valid file name', () => {
      const validData = {
        bountyObjectId: '0x123abc',
        fileName: 'my-image.jpg',
        label: 'cat',
      };

      const result = submitLabelSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty file name', () => {
      const invalidData = {
        bountyObjectId: '0x123abc',
        fileName: '',
        label: 'cat',
      };

      const result = submitLabelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('File name is required');
      }
    });

    it('should reject whitespace-only file name', () => {
      const invalidData = {
        bountyObjectId: '0x123abc',
        fileName: '   ',
        label: 'cat',
      };

      const result = submitLabelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('File name cannot be only whitespace');
      }
    });
  });

  describe('label validation', () => {
    it('should accept valid label', () => {
      const validData = {
        bountyObjectId: '0x123abc',
        fileName: 'image1.jpg',
        label: 'dog',
      };

      const result = submitLabelSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty label', () => {
      const invalidData = {
        bountyObjectId: '0x123abc',
        fileName: 'image1.jpg',
        label: '',
      };

      const result = submitLabelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Label is required');
      }
    });

    it('should reject whitespace-only label', () => {
      const invalidData = {
        bountyObjectId: '0x123abc',
        fileName: 'image1.jpg',
        label: '   ',
      };

      const result = submitLabelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Label cannot be only whitespace');
      }
    });
  });
});
