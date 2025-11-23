'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import {
  useCurrentAccount,
  useDisconnectWallet,
} from '@mysten/dapp-kit';
import { parseWalletError, logError } from './error-handler';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  disconnect: () => void;
  error: string | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Wallet Provider with enhanced error handling
 * Requirements: 1.4
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [error, setError] = useState<string | null>(null);

  const handleDisconnect = useCallback(() => {
    try {
      console.log('[Wallet] Disconnecting wallet');
      disconnect();
      setError(null);
    } catch (err) {
      logError('Wallet Disconnect', err);
      const parsedError = parseWalletError(err);
      setError(parsedError.userMessage);
    }
  }, [disconnect]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: WalletContextType = {
    address: currentAccount?.address || null,
    isConnected: !!currentAccount,
    disconnect: handleDisconnect,
    error,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
