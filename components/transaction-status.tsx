'use client';

import { useState } from 'react';
import type { TransactionResult } from '@/types/sui-contract';
import { EventDisplay } from './event-display';

interface TransactionStatusProps {
  result: TransactionResult;
  onDismiss?: () => void;
}

export function TransactionStatus({ result, onDismiss }: TransactionStatusProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyObjectId = async () => {
    if (result.objectId) {
      try {
        await navigator.clipboard.writeText(result.objectId);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy object ID:', error);
      }
    }
  };

  if (result.success) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Transaction Successful!
          </h3>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
        
        {result.objectId && (
          <div className="space-y-2 mt-3">
            <p className="text-sm text-green-700 dark:text-green-300">
              Object ID:
            </p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800 rounded text-xs font-mono text-green-900 dark:text-green-100 break-all">
                {result.objectId}
              </code>
              <button
                onClick={handleCopyObjectId}
                className="px-3 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 rounded-md whitespace-nowrap"
                aria-label="Copy object ID to clipboard"
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
        
        {result.digest && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-mono break-all">
            Digest: {result.digest}
          </p>
        )}
        
        {result.events && result.events.length > 0 && (
          <div className="mt-3">
            {result.events.map((event, index) => (
              <EventDisplay key={index} event={event} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
          Transaction Failed
        </h3>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-sm text-red-700 dark:text-red-300">
        {result.error || 'An unknown error occurred'}
      </p>
    </div>
  );
}
