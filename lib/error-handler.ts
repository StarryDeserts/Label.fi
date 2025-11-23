/**
 * Error Handler Utilities
 * Provides error parsing, formatting, and retry logic
 * Requirements: 1.4, 2.5, 3.6
 */

export enum ErrorType {
  WALLET_CONNECTION = 'WALLET_CONNECTION',
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  WALLET_REJECTED = 'WALLET_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_OBJECT = 'INVALID_OBJECT',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ParsedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  details?: string;
}

/**
 * Parses wallet connection errors and provides user-friendly messages
 * Requirements: 1.4
 */
export function parseWalletError(error: unknown): ParsedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  console.error('[Wallet Error]', errorMessage, error);

  // User rejected the connection
  if (
    errorMessage.includes('rejected') ||
    errorMessage.includes('denied') ||
    errorMessage.includes('cancelled')
  ) {
    return {
      type: ErrorType.WALLET_REJECTED,
      message: errorMessage,
      userMessage: 'Wallet connection was rejected. Please try again and approve the connection.',
      canRetry: true,
    };
  }

  // No wallet installed
  if (
    errorMessage.includes('not installed') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('no wallet')
  ) {
    return {
      type: ErrorType.WALLET_NOT_INSTALLED,
      message: errorMessage,
      userMessage: 'No Sui wallet detected. Please install a Sui wallet extension (e.g., Sui Wallet).',
      canRetry: false,
    };
  }

  // Network mismatch
  if (errorMessage.includes('network') || errorMessage.includes('chain')) {
    return {
      type: ErrorType.WALLET_CONNECTION,
      message: errorMessage,
      userMessage: 'Please ensure your wallet is connected to Sui Testnet.',
      canRetry: true,
    };
  }

  // Generic wallet error
  return {
    type: ErrorType.WALLET_CONNECTION,
    message: errorMessage,
    userMessage: 'Failed to connect wallet. Please try again.',
    canRetry: true,
    details: errorMessage,
  };
}

/**
 * Parses transaction errors and provides user-friendly messages
 * Requirements: 2.5, 3.6
 */
export function parseTransactionError(error: unknown): ParsedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  console.error('[Transaction Error]', errorMessage, error);

  // Insufficient balance
  if (
    errorMessage.includes('insufficient') ||
    errorMessage.includes('balance') ||
    errorMessage.includes('not enough')
  ) {
    return {
      type: ErrorType.INSUFFICIENT_BALANCE,
      message: errorMessage,
      userMessage: 'Insufficient balance. Please ensure you have enough SUI for the reward amount and gas fees.',
      canRetry: false,
    };
  }

  // Invalid object ID
  if (
    errorMessage.includes('object') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('does not exist')
  ) {
    return {
      type: ErrorType.INVALID_OBJECT,
      message: errorMessage,
      userMessage: 'Invalid or non-existent object ID. Please check the bounty object ID and try again.',
      canRetry: false,
    };
  }

  // Contract execution failure
  if (
    errorMessage.includes('execution') ||
    errorMessage.includes('contract') ||
    errorMessage.includes('move')
  ) {
    return {
      type: ErrorType.CONTRACT_ERROR,
      message: errorMessage,
      userMessage: 'Smart contract execution failed. Please check your input and try again.',
      canRetry: true,
      details: errorMessage,
    };
  }

  // User rejected transaction
  if (
    errorMessage.includes('rejected') ||
    errorMessage.includes('denied') ||
    errorMessage.includes('cancelled')
  ) {
    return {
      type: ErrorType.WALLET_REJECTED,
      message: errorMessage,
      userMessage: 'Transaction was rejected. Please try again and approve the transaction.',
      canRetry: true,
    };
  }

  // Network error
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: errorMessage,
      userMessage: 'Network error occurred. Please check your connection and try again.',
      canRetry: true,
    };
  }

  // Generic transaction error
  return {
    type: ErrorType.TRANSACTION_FAILED,
    message: errorMessage,
    userMessage: 'Transaction failed. Please try again.',
    canRetry: true,
    details: errorMessage,
  };
}

/**
 * Parses network errors and provides user-friendly messages
 */
export function parseNetworkError(error: unknown): ParsedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  console.error('[Network Error]', errorMessage, error);

  // RPC endpoint unavailable
  if (
    errorMessage.includes('unavailable') ||
    errorMessage.includes('503') ||
    errorMessage.includes('502')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: errorMessage,
      userMessage: 'RPC endpoint is temporarily unavailable. Please try again in a moment.',
      canRetry: true,
    };
  }

  // Timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: errorMessage,
      userMessage: 'Request timed out. Please check your connection and try again.',
      canRetry: true,
    };
  }

  // Rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: errorMessage,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      canRetry: true,
    };
  }

  // Generic network error
  return {
    type: ErrorType.NETWORK_ERROR,
    message: errorMessage,
    userMessage: 'Network error occurred. Please check your connection and try again.',
    canRetry: true,
    details: errorMessage,
  };
}

/**
 * Retry logic with exponential backoff
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        console.error(`[Retry] All ${maxAttempts} attempts failed`);
        break;
      }

      // Check if error is retryable - try transaction error first, then network error
      const errorMessage = error instanceof Error ? error.message : String(error);
      let canRetry = true;
      
      // Check for non-retryable transaction errors
      if (
        errorMessage.includes('insufficient') ||
        errorMessage.includes('balance') ||
        errorMessage.includes('object') ||
        errorMessage.includes('not found')
      ) {
        canRetry = false;
      }
      
      if (!canRetry) {
        console.log('[Retry] Error is not retryable, stopping');
        throw error;
      }

      console.log(`[Retry] Waiting ${delay}ms before next attempt`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Logs error details for debugging
 */
export function logError(context: string, error: unknown, additionalInfo?: Record<string, any>) {
  console.group(`[Error] ${context}`);
  console.error('Error:', error);
  
  if (error instanceof Error) {
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
  
  if (additionalInfo) {
    console.error('Additional Info:', additionalInfo);
  }
  
  console.groupEnd();
}
