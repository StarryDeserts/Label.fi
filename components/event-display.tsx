'use client';

import type { LabelFinalizedEvent } from '@/types/sui-contract';

interface EventDisplayProps {
  event: LabelFinalizedEvent;
}

export function EventDisplay({ event }: EventDisplayProps) {
  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
        Label Finalized Event
      </h4>
      
      <div className="space-y-2">
        <div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Bounty ID:
          </p>
          <code className="block mt-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded text-xs font-mono text-blue-900 dark:text-blue-100 break-all">
            {event.bountyId}
          </code>
        </div>
        
        <div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            File Name:
          </p>
          <code className="block mt-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded text-xs font-mono text-blue-900 dark:text-blue-100">
            {event.fileName}
          </code>
        </div>
        
        <div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Final Label:
          </p>
          <code className="block mt-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded text-xs font-mono text-blue-900 dark:text-blue-100">
            {event.finalLabel}
          </code>
        </div>
      </div>
    </div>
  );
}
