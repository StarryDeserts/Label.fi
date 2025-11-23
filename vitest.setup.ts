import '@testing-library/jest-dom';

// Set up environment variables for tests
process.env.NEXT_PUBLIC_SUI_NETWORK = 'testnet';
process.env.NEXT_PUBLIC_SUI_RPC_URL = 'https://fullnode.testnet.sui.io:443';
process.env.NEXT_PUBLIC_DATAPACT_PACKAGE_ID = '0x0000000000000000000000000000000000000000000000000000000000000000';
