/**
 * TypeScript types for datapact::datapact smart contract interactions
 */

import { TransactionObjectArgument } from '@mysten/sui/transactions';

// Smart Contract Configuration
export interface ContractConfig {
  packageId: string;
  network: 'testnet' | 'mainnet' | 'devnet';
  rpcUrl: string;
}

// Transaction Parameters
export interface CreateBountyParams {
  name: string;
  fileNameList: string[];
  blobIds: string[];
  allowedLabels: string[];
  totalImages: number;
  rewardCoin: TransactionObjectArgument;
}

export interface SubmitLabelParams {
  bountyObjectId: string;
  fileName: string;
  label: string;
}

// Transaction Results
export interface TransactionResult {
  success: boolean;
  digest?: string;
  objectId?: string;
  events?: SuiEvent[];
  error?: string;
}

// Event Types
export interface LabelFinalizedEvent {
  type: 'LabelFinalizedEvent';
  bountyId: string;
  fileName: string;
  finalLabel: string;
  timestamp: number;
}

export type SuiEvent = LabelFinalizedEvent;


export type DatasetBounty = {
  id: { id: string };
  name: string;
  allowed_labels: string[];
  walrus_bolb_ids: {
    fields: {
      id: { id: string };
      size: string;
    };
  };
  reward_pool: number;
  total_images: number;
  completed_counts: number;
};

export interface State {
  bountys: CreateBountyEvent[];
}

export type DynamicField = {
  id: { id: string };
  name: string;
  value: string;
}

export type CreateBountyEvent = {
  id: string;
  name: string;
  allowed_labels: string[];
  total_images: number;
}

export interface SubmitLabelFormData {
  bountyObjectId: string;
  fileName: string;
  label: string;
}

// Wallet Types
export interface WalletState {
  connected: boolean;
  address?: string;
  connecting: boolean;
  error?: string;
}

// Transaction Status
export type TransactionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface TransactionState {
  status: TransactionStatus;
  digest?: string;
  objectId?: string;
  events?: SuiEvent[];
  error?: string;
}
