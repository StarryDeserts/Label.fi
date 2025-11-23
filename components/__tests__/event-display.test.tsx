import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventDisplay } from '../event-display';
import type { LabelFinalizedEvent } from '@/types/sui-contract';

describe('EventDisplay', () => {
  it('should display all event fields', () => {
    const event: LabelFinalizedEvent = {
      type: 'LabelFinalizedEvent',
      bountyId: '0x123abc',
      fileName: 'test-image.jpg',
      finalLabel: 'cat',
      timestamp: Date.now(),
    };

    render(<EventDisplay event={event} />);

    expect(screen.getByText('Label Finalized Event')).toBeInTheDocument();
    expect(screen.getByText('Bounty ID:')).toBeInTheDocument();
    expect(screen.getByText('0x123abc')).toBeInTheDocument();
    expect(screen.getByText('File Name:')).toBeInTheDocument();
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.getByText('Final Label:')).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();
  });

  it('should display event with long bounty ID', () => {
    const event: LabelFinalizedEvent = {
      type: 'LabelFinalizedEvent',
      bountyId: '0x' + 'a'.repeat(64),
      fileName: 'image.png',
      finalLabel: 'dog',
      timestamp: Date.now(),
    };

    render(<EventDisplay event={event} />);

    expect(screen.getByText('0x' + 'a'.repeat(64))).toBeInTheDocument();
  });

  it('should display event with special characters in file name', () => {
    const event: LabelFinalizedEvent = {
      type: 'LabelFinalizedEvent',
      bountyId: '0x123',
      fileName: 'test-file_v2 (1).jpg',
      finalLabel: 'bird',
      timestamp: Date.now(),
    };

    render(<EventDisplay event={event} />);

    expect(screen.getByText('test-file_v2 (1).jpg')).toBeInTheDocument();
  });
});
