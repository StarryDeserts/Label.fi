import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSuiConfig, getContractTarget, SUI_COIN_TYPE } from '../sui-config';

describe('Sui Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUI_NETWORK: 'testnet',
      NEXT_PUBLIC_SUI_RPC_URL: 'https://fullnode.testnet.sui.io:443',
      NEXT_PUBLIC_DATAPACT_PACKAGE_ID: '0x123',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return correct configuration', () => {
    const config = getSuiConfig();
    expect(config.network).toBe('testnet');
    expect(config.rpcUrl).toBe('https://fullnode.testnet.sui.io:443');
    expect(config.packageId).toBe('0x123');
  });

  it('should generate correct contract target', () => {
    const target = getContractTarget('create_database_bounty');
    expect(target).toBe('0x123::datapact::create_database_bounty');
  });

  it('should export correct SUI coin type', () => {
    expect(SUI_COIN_TYPE).toBe('0x2::sui::SUI');
  });
});
