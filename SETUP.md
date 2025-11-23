# Project Setup

This document describes the project dependencies and configuration for the Sui DataPact Frontend.

## Dependencies Installed

### Sui SDK Packages
- `@mysten/sui` (v1.45.0) - Core Sui SDK for blockchain interactions
- `@mysten/dapp-kit` (v0.19.9) - Wallet connection and dApp utilities

### Form Handling
- `react-hook-form` (v7.66.1) - Form state management and validation
- `zod` (v4.1.12) - Schema validation
- `@hookform/resolvers` (v5.2.2) - Integration between react-hook-form and zod

### Testing Packages
- `vitest` (v4.0.13) - Fast unit test framework
- `@testing-library/react` (v16.3.0) - React component testing utilities
- `@testing-library/jest-dom` (v6.9.1) - Custom jest matchers for DOM
- `fast-check` (v4.3.0) - Property-based testing library
- `jsdom` (v27.2.0) - DOM implementation for testing
- `@vitejs/plugin-react` (v5.1.1) - Vite plugin for React

## Configuration Files

### Environment Variables
- `.env.local` - Local environment configuration (not committed)
- `.env.example` - Example environment configuration template

Required environment variables:
```
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_DATAPACT_PACKAGE_ID=<your_package_id>
```

### Testing Configuration
- `vitest.config.ts` - Vitest configuration with React plugin
- `vitest.setup.ts` - Test setup file for jest-dom matchers

### TypeScript Types
- `types/sui-contract.ts` - Type definitions for smart contract interactions
- `lib/sui-config.ts` - Sui network configuration utilities

## Available Scripts

```bash
# Development
pnpm dev              # Start Next.js development server

# Building
pnpm build            # Build production bundle

# Testing
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode

# Linting
pnpm lint             # Run ESLint
```

## Next Steps

1. Set your deployed contract package ID in `.env.local`
2. Implement wallet connection infrastructure (Task 2)
3. Create transaction service layer (Task 3)
4. Build form components (Tasks 4-5)

## Testing Strategy

The project uses a dual testing approach:

1. **Unit Tests**: Test specific examples and component behavior
2. **Property-Based Tests**: Test universal properties across random inputs using fast-check

Each property test should run a minimum of 100 iterations and be tagged with:
```typescript
// Feature: sui-datapact-frontend, Property {number}: {property_text}
```
