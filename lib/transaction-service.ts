/**
 * Transaction Service Layer
 * Handles all blockchain interactions with the datapact::datapact smart contract
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { SuiTransactionBlockResponse, SuiEvent as SuiEventType } from '@mysten/sui/client';
import {
  CreateBountyParams,
  SubmitLabelParams,
  TransactionResult,
  LabelFinalizedEvent,
  SuiEvent,
} from '@/types/sui-contract';
import { getContractTarget, SUI_COIN_TYPE } from './sui-config';
import { parseTransactionError, parseNetworkError, retryWithBackoff, logError } from './error-handler';

export class TransactionService {
  private client: SuiClient;

  constructor(client: SuiClient) {
    this.client = client;
  }

  /**
   * Creates a new dataset bounty on the blockchain
   * Requirements: 2.2, 2.3, 6.2, 6.3
   */
  async createBounty(
    params: CreateBountyParams,
    senderAddress: string
  ): Promise<TransactionResult> {
    try {
      console.log('[TransactionService] Creating bounty', { name: params.name, sender: senderAddress });
      
      const tx = new Transaction();

      // Build the transaction to call create_database_bounty
      tx.moveCall({
        target: getContractTarget('create_database_bounty'),
        typeArguments: [SUI_COIN_TYPE],
        arguments: [
          tx.pure.string(params.name),
          tx.pure.vector('string', params.fileNameList),
          tx.pure.vector('string', params.blobIds),
          tx.pure.vector('string', params.allowedLabels),
          tx.pure.u64(params.totalImages),
          params.rewardCoin,
        ],
      });

      console.log('[TransactionService] Bounty transaction built successfully');
      
      return {
        success: true,
        digest: 'pending', // Will be filled by wallet execution
      };
    } catch (error) {
      logError('Create Bounty', error, { params, senderAddress });
      const parsedError = parseTransactionError(error);
      return {
        success: false,
        error: parsedError.userMessage,
      };
    }
  }

  /**
   * Submits a label for a file in a dataset bounty
   * Requirements: 3.3, 6.4
   */
  async submitLabel(
    params: SubmitLabelParams,
    senderAddress: string
  ): Promise<TransactionResult> {
    try {
      console.log('[TransactionService] Submitting label', { 
        bountyId: params.bountyObjectId, 
        fileName: params.fileName,
        label: params.label,
        sender: senderAddress 
      });
      
      const tx = new Transaction();

      // Build the transaction to call submit_label
      tx.moveCall({
        target: getContractTarget('submit_label'),
        typeArguments: [SUI_COIN_TYPE],
        arguments: [
          tx.object(params.bountyObjectId), // Mutable reference to DatasetBounty
          tx.pure.string(params.fileName),
          tx.pure.string(params.label),
        ],
      });

      console.log('[TransactionService] Label submission transaction built successfully');
      
      return {
        success: true,
        digest: 'pending',
      };
    } catch (error) {
      logError('Submit Label', error, { params, senderAddress });
      const parsedError = parseTransactionError(error);
      return {
        success: false,
        error: parsedError.userMessage,
      };
    }
  }

  /**
   * Splits a coin to create a reward coin with the specified amount
   * Requirements: 2.3
   */
  splitCoin(tx: Transaction, amount: number) {
    // Split the coin from gas coin
    const [coin] = tx.splitCoins(tx.gas, [amount]);
    return coin;
  }

  /**
   * Parses transaction response to extract object IDs and events
   * Requirements: 6.5
   */
  parseTransactionResponse(response: SuiTransactionBlockResponse): TransactionResult {
    try {
      console.log('[TransactionService] Parsing transaction response', { digest: response.digest });
      
      const { digest, effects, events } = response;

      if (!effects) {
        logError('Parse Transaction Response', new Error('No effects in response'), { digest });
        return {
          success: false,
          error: 'Transaction effects not available. Please try again.',
        };
      }

      // Check transaction status
      const status = effects.status.status;
      if (status !== 'success') {
        const errorMessage = effects.status.error || 'Transaction failed';
        console.error('[TransactionService] Transaction failed', { digest, status, error: errorMessage });
        
        const parsedError = parseTransactionError(new Error(errorMessage));
        return {
          success: false,
          digest,
          error: parsedError.userMessage,
        };
      }

      // Extract created object IDs (for bounty creation)
      let objectId: string | undefined;
      if (effects.created && effects.created.length > 0) {
        // Get the first created object (should be the DatasetBounty)
        objectId = effects.created[0].reference.objectId;
        console.log('[TransactionService] Created object ID:', objectId);
      }

      // Parse events
      const parsedEvents = this.parseEvents(events || []);
      console.log('[TransactionService] Parsed events:', parsedEvents.length);

      return {
        success: true,
        digest,
        objectId,
        events: parsedEvents,
      };
    } catch (error) {
      logError('Parse Transaction Response', error);
      const parsedError = parseTransactionError(error);
      return {
        success: false,
        error: parsedError.userMessage,
      };
    }
  }

  /**
   * Parses events from transaction effects to extract LabelFinalizedEvent
   * Requirements: 3.4
   */
  parseEvents(events: SuiEventType[]): SuiEvent[] {
    const parsedEvents: SuiEvent[] = [];

    for (const event of events) {
      // Check if this is a LabelFinalizedEvent
      if (event.type.includes('LabelFinalizedEvent')) {
        const labelEvent = this.parseLabelFinalizedEvent(event);
        if (labelEvent) {
          parsedEvents.push(labelEvent);
        }
      }
    }

    return parsedEvents;
  }

  /**
   * Parses a LabelFinalizedEvent from a Sui event
   * Requirements: 3.4
   */
  private parseLabelFinalizedEvent(event: SuiEventType): LabelFinalizedEvent | null {
    try {
      const parsedJson = event.parsedJson as any;

      if (!parsedJson) {
        return null;
      }

      return {
        type: 'LabelFinalizedEvent',
        bountyId: parsedJson.bounty_id || parsedJson.bountyId || '',
        fileName: parsedJson.file_name || parsedJson.fileName || '',
        finalLabel: parsedJson.final_label || parsedJson.finalLabel || '',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to parse LabelFinalizedEvent:', error);
      return null;
    }
  }

  /**
   * Builds a complete transaction for creating a bounty with coin splitting
   * Requirements: 2.2, 2.3, 6.2, 6.3
   */
  buildCreateBountyTransaction(
    params: Omit<CreateBountyParams, 'rewardCoin'> & { rewardAmount: number }
  ): Transaction {
    const tx = new Transaction();

    // Split coin for reward
    const rewardCoin = this.splitCoin(tx, params.rewardAmount);

    // Call create_database_bounty
    tx.moveCall({
      target: getContractTarget('create_database_bounty'),
      typeArguments: [SUI_COIN_TYPE],
      arguments: [
        tx.pure.string(params.name),
        tx.pure.vector('string', params.fileNameList),
        tx.pure.vector('string', params.blobIds),
        tx.pure.vector('string', params.allowedLabels),
        tx.pure.u64(params.totalImages),
        rewardCoin,
      ],
    });

    return tx;
  }

  /**
   * Builds a complete transaction for submitting a label
   * Requirements: 3.3, 6.4
   */
  buildSubmitLabelTransaction(params: SubmitLabelParams): Transaction {
    const tx = new Transaction();

    // Call submit_label with mutable reference to bounty object
    tx.moveCall({
      target: getContractTarget('submit_label'),
      typeArguments: [SUI_COIN_TYPE],
      arguments: [
        tx.object(params.bountyObjectId),
        tx.pure.string(params.fileName),
        tx.pure.string(params.label),
      ],
    });

    return tx;
  }

  /**
   * Waits for transaction with retry logic for network errors
   * Requirements: 2.5, 3.6
   */
  async waitForTransactionWithRetry(
    digest: string,
    options: {
      showEffects?: boolean;
      showEvents?: boolean;
      showObjectChanges?: boolean;
    } = {}
  ): Promise<SuiTransactionBlockResponse> {
    console.log('[TransactionService] Waiting for transaction', { digest });
    
    try {
      return await retryWithBackoff(
        async () => {
          return await this.client.waitForTransaction({
            digest,
            options: {
              showEffects: true,
              showEvents: true,
              showObjectChanges: true,
              ...options,
            },
          });
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000,
        }
      );
    } catch (error) {
      logError('Wait For Transaction', error, { digest });
      const parsedError = parseNetworkError(error);
      throw new Error(parsedError.userMessage);
    }
  }
}

/**
 * Factory function to create a TransactionService instance
 */
export function createTransactionService(client: SuiClient): TransactionService {
  return new TransactionService(client);
}
