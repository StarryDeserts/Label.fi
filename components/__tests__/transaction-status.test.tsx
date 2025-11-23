import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionStatus } from '../transaction-status';
import type { TransactionResult } from '@/types/sui-contract';

describe('TransactionStatus', () => {
  it('displays success message with object ID', () => {
    const result: TransactionResult = {
      success: true,
      objectId: '0x1234567890abcdef',
      digest: '0xabcdef1234567890',
    };

    render(<TransactionStatus result={result} />);

    expect(screen.getByText('Transaction Successful!')).toBeInTheDocument();
    expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
    expect(screen.getByText(/Digest: 0xabcdef1234567890/)).toBeInTheDocument();
  });

  it('displays error message on failure', () => {
    const result: TransactionResult = {
      success: false,
      error: 'Insufficient balance',
    };

    render(<TransactionStatus result={result} />);

    expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
    expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
  });

  it('copies object ID to clipboard when copy button is clicked', async () => {
    const result: TransactionResult = {
      success: true,
      objectId: '0x1234567890abcdef',
    };

    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<TransactionStatus result={result} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('0x1234567890abcdef');
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    const result: TransactionResult = {
      success: true,
      objectId: '0x1234567890abcdef',
    };

    render(<TransactionStatus result={result} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('displays default error message when error is undefined', () => {
    const result: TransactionResult = {
      success: false,
    };

    render(<TransactionStatus result={result} />);

    expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
  });

  it('displays LabelFinalizedEvent when present in result', () => {
    const result: TransactionResult = {
      success: true,
      digest: '0xabcdef1234567890',
      events: [
        {
          type: 'LabelFinalizedEvent',
          bountyId: '0x123abc',
          fileName: 'test-image.jpg',
          finalLabel: 'cat',
          timestamp: Date.now(),
        },
      ],
    };

    render(<TransactionStatus result={result} />);

    expect(screen.getByText('Transaction Successful!')).toBeInTheDocument();
    expect(screen.getByText('Label Finalized Event')).toBeInTheDocument();
    expect(screen.getByText('0x123abc')).toBeInTheDocument();
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();
  });

  it('displays multiple events when present', () => {
    const result: TransactionResult = {
      success: true,
      digest: '0xabcdef1234567890',
      events: [
        {
          type: 'LabelFinalizedEvent',
          bountyId: '0x123',
          fileName: 'image1.jpg',
          finalLabel: 'cat',
          timestamp: Date.now(),
        },
        {
          type: 'LabelFinalizedEvent',
          bountyId: '0x456',
          fileName: 'image2.jpg',
          finalLabel: 'dog',
          timestamp: Date.now(),
        },
      ],
    };

    render(<TransactionStatus result={result} />);

    expect(screen.getAllByText('Label Finalized Event')).toHaveLength(2);
    expect(screen.getByText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByText('image2.jpg')).toBeInTheDocument();
  });
});
