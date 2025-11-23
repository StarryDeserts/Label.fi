'use client';

import React from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useWallet } from '@/lib/wallet-context';

/**
 * Truncates a wallet address for display
 * Shows first 6 and last 4 characters with ellipsis in between
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function WalletButton() {
  const currentAccount = useCurrentAccount();
  const { error, clearError } = useWallet();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-4">
        {currentAccount && (
          <div className="px-4 py-2 glass dark:glass-dark rounded-lg text-sm font-mono font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            {truncateAddress(currentAccount.address)}
          </div>
        )}
        <ConnectButton connectText="Connect Wallet" />
      </div>
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={clearError}
            className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
