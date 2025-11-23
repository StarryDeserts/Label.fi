'use client';

import { ReactNode } from 'react';
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { getNetworkConfig } from '@/lib/network-config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from '@/lib/wallet-context';
import { ErrorBoundary } from './error-boundary';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const networks = getNetworkConfig();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networks} defaultNetwork="testnet">
          <SuiWalletProvider autoConnect>
            <WalletProvider>{children}</WalletProvider>
          </SuiWalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
