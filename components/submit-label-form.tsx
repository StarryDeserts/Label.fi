'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitLabelSchema } from '@/lib/validation-schemas';
import { useWallet } from '@/lib/wallet-context';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { createTransactionService } from '@/lib/transaction-service';
import { useState, useRef } from 'react';
import type { TransactionResult } from '@/types/sui-contract';
import { z } from 'zod';
import { TransactionStatus } from './transaction-status';
import { ConfirmationDialog } from './confirmation-dialog';
import { Tooltip } from './tooltip';
import { toast } from 'sonner';

type SubmitLabelFormData = z.infer<typeof submitLabelSchema>;

export function SubmitLabelForm() {
  const { address, isConnected } = useWallet();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [transactionState, setTransactionState] = useState<TransactionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<SubmitLabelFormData | null>(null);
  const bountyIdInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<SubmitLabelFormData>({
    resolver: zodResolver(submitLabelSchema),
    mode: 'onChange',
    defaultValues: {
      bountyObjectId: '',
      fileName: '',
      label: '',
    },
  });

  const handleFormSubmit = (data: SubmitLabelFormData) => {
    // Show confirmation dialog before submitting
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    if (pendingFormData) {
      onSubmit(pendingFormData);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
  };

  const onSubmit = async (data: SubmitLabelFormData) => {
    if (!isConnected || !address) {
      const errorMsg = 'Please connect your wallet first';
      setTransactionState({
        success: false,
        error: errorMsg,
      });
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setTransactionState(null);
    toast.loading('Submitting label...', { id: 'submit-label' });

    try {
      console.log('[SubmitLabelForm] Starting label submission', { 
        bountyId: data.bountyObjectId,
        fileName: data.fileName,
        label: data.label 
      });
      
      const transactionService = createTransactionService(suiClient);

      const tx = transactionService.buildSubmitLabelTransaction({
        bountyObjectId: data.bountyObjectId,
        fileName: data.fileName,
        label: data.label,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            try {
              console.log('[SubmitLabelForm] Transaction signed, waiting for confirmation', { digest: result.digest });
              
              // Use retry logic for waiting for transaction
              const txResponse = await transactionService.waitForTransactionWithRetry(result.digest);
              
              const parsedResult = transactionService.parseTransactionResponse(txResponse);
              setTransactionState(parsedResult);
              setIsSubmitting(false);
              
              if (parsedResult.success) {
                console.log('[SubmitLabelForm] Label submitted successfully', { 
                  events: parsedResult.events?.length 
                });
                const hasEvent = parsedResult.events && parsedResult.events.length > 0;
                toast.success('Label submitted successfully!', { 
                  id: 'submit-label',
                  description: hasEvent ? 'Label finalized event detected' : undefined
                });
                reset();
                // Focus back to bounty ID input for next entry
                setTimeout(() => bountyIdInputRef.current?.focus(), 100);
              } else {
                console.error('[SubmitLabelForm] Label submission failed', { error: parsedResult.error });
                toast.error('Label submission failed', { 
                  id: 'submit-label',
                  description: parsedResult.error 
                });
              }
            } catch (error) {
              console.error('[SubmitLabelForm] Error waiting for transaction', error);
              const errorMsg = error instanceof Error ? error.message : 'Failed to fetch transaction details';
              setTransactionState({
                success: false,
                error: errorMsg,
              });
              toast.error('Transaction failed', { 
                id: 'submit-label',
                description: errorMsg 
              });
              setIsSubmitting(false);
            }
          },
          onError: (error) => {
            console.error('[SubmitLabelForm] Transaction signing failed', error);
            const errorMsg = error.message || 'Transaction failed';
            setTransactionState({
              success: false,
              error: errorMsg,
            });
            toast.error('Transaction signing failed', { 
              id: 'submit-label',
              description: errorMsg 
            });
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('[SubmitLabelForm] Error building transaction', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setTransactionState({
        success: false,
        error: errorMsg,
      });
      toast.error('Failed to build transaction', { 
        id: 'submit-label',
        description: errorMsg 
      });
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <p className="text-zinc-600 dark:text-zinc-400 text-center">
          Please connect your wallet to submit a label
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        Submit Label
      </h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="bountyObjectId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Bounty Object ID *
            </label>
            <Tooltip content="The object ID of the bounty you want to submit a label for">
              <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Tooltip>
          </div>
          <input
            id="bountyObjectId"
            type="text"
            autoFocus
            tabIndex={1}
            {...register('bountyObjectId', {
              setValueAs: (v) => v,
              onChange: (e) => {
                bountyIdInputRef.current = e.target;
              }
            })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors font-mono text-sm"
            placeholder="0x..."
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Copy this from the bounty creation success message
          </p>
          {errors.bountyObjectId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.bountyObjectId.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="fileName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              File Name *
            </label>
            <Tooltip content="The name of the file you want to label">
              <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Tooltip>
          </div>
          <input
            id="fileName"
            type="text"
            tabIndex={2}
            {...register('fileName')}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            placeholder="e.g., image001.jpg"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Must match one of the file names in the bounty
          </p>
          {errors.fileName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.fileName.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="label" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Label *
            </label>
            <Tooltip content="Choose the appropriate label for this file">
              <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Tooltip>
          </div>
          <select
            id="label"
            tabIndex={3}
            {...register('label')}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <option value="">Select a label</option>
            <option value="cat">Cat</option>
            <option value="dog">Dog</option>
            <option value="bird">Bird</option>
            <option value="other">Other</option>
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Select from the allowed labels defined in the bounty
          </p>
          {errors.label && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.label.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-500 disabled:hover:bg-zinc-300 dark:disabled:hover:bg-zinc-700 transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting Label...
            </span>
          ) : 'Submit Label'}
        </button>
      </form>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Confirm Label Submission"
        message={`You are about to submit the label "${pendingFormData?.label}" for file "${pendingFormData?.fileName}". This will require a transaction signature and gas fees.`}
        confirmText="Submit Label"
        cancelText="Cancel"
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />

      {transactionState && (
        <div className="mt-6">
          <TransactionStatus 
            result={transactionState} 
            onDismiss={() => setTransactionState(null)}
          />
        </div>
      )}
    </div>
  );
}
