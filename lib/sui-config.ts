/**
 * Sui Network Configuration
 */

import { ContractConfig } from '@/types/sui-contract';

// Validate environment variables
const validateEnv = () => {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK;
  const rpcUrl = process.env.NEXT_PUBLIC_SUI_RPC_URL;
  const packageId = process.env.NEXT_PUBLIC_DATAPACT_PACKAGE_ID;

  if (!network) {
    throw new Error('NEXT_PUBLIC_SUI_NETWORK is not defined');
  }

  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_SUI_RPC_URL is not defined');
  }

  if (!packageId) {
    console.warn('NEXT_PUBLIC_DATAPACT_PACKAGE_ID is not defined. Please set it before using the application.');
  }

  return { network, rpcUrl, packageId };
};

// Export configuration
export const getSuiConfig = (): ContractConfig => {
  const { network, rpcUrl, packageId } = validateEnv();

  return {
    packageId: packageId || '',
    network: network as 'testnet' | 'mainnet' | 'devnet',
    rpcUrl,
  };
};

// Contract function targets
export const getContractTarget = (functionName: string): string => {
  const config = getSuiConfig();
  return `${config.packageId}::datapact::${functionName}`;
};

// Sui coin type
export const SUI_COIN_TYPE = '0x2::sui::SUI';

// Network endpoints
export const NETWORK_ENDPOINTS = {
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
} as const;
