import { getFullnodeUrl } from '@mysten/sui/client';

export function getNetworkConfig() {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
  const customRpcUrl = process.env.NEXT_PUBLIC_SUI_RPC_URL;

  return {
    testnet: {
      url: customRpcUrl || getFullnodeUrl('testnet'),
    },
    mainnet: {
      url: getFullnodeUrl('mainnet'),
    },
    devnet: {
      url: getFullnodeUrl('devnet'),
    },
  };
}
