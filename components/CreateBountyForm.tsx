'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBountySchema } from '@/lib/validation-schemas';
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

type CreateBountyFormData = z.infer<typeof createBountySchema>;

export function CreateBountyForm() {
  const { address, isConnected } = useWallet();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [transactionState, setTransactionState] = useState<TransactionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileEntries, setFileEntries] = useState<Array<{ fileName: string; blobId: string }>>([
    { fileName: '', blobId: '' },
  ]);
  const [labels, setLabels] = useState<string[]>(['']);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CreateBountyFormData | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    trigger,
  } = useForm<CreateBountyFormData>({
    resolver: zodResolver(createBountySchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      fileNames: [''],
      blobIds: [''],
      allowedLabels: [''],
      totalImages: 1,
      rewardAmount: 0.1,
    },
  });

  const handleFormSubmit = (data: CreateBountyFormData) => {
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

  const onSubmit = async (data: CreateBountyFormData) => {
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
    toast.loading('Creating bounty...', { id: 'create-bounty' });

    try {
      console.log('[CreateBountyForm] Starting bounty creation', { name: data.name });
      
      const transactionService = createTransactionService(suiClient);
      const rewardAmountInMist = Math.floor(data.rewardAmount * 1_000_000_000);

      const tx = transactionService.buildCreateBountyTransaction({
        name: data.name,
        fileNameList: data.fileNames,
        blobIds: data.blobIds,
        allowedLabels: data.allowedLabels,
        totalImages: data.totalImages,
        rewardAmount: rewardAmountInMist,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            try {
              console.log('[CreateBountyForm] Transaction signed, waiting for confirmation', { digest: result.digest });
              
              // Use retry logic for waiting for transaction
              const txResponse = await transactionService.waitForTransactionWithRetry(result.digest);
              
              const parsedResult = transactionService.parseTransactionResponse(txResponse);
              setTransactionState(parsedResult);
              setIsSubmitting(false);
              
              if (parsedResult.success) {
                console.log('[CreateBountyForm] Bounty created successfully', { objectId: parsedResult.objectId });
                toast.success('Bounty created successfully!', { 
                  id: 'create-bounty',
                  description: parsedResult.objectId ? `Object ID: ${parsedResult.objectId.slice(0, 10)}...` : undefined
                });
                reset();
                setFileEntries([{ fileName: '', blobId: '' }]);
                setLabels(['']);
                // Focus back to name input for next entry
                setTimeout(() => nameInputRef.current?.focus(), 100);
              } else {
                console.error('[CreateBountyForm] Bounty creation failed', { error: parsedResult.error });
                toast.error('Bounty creation failed', { 
                  id: 'create-bounty',
                  description: parsedResult.error 
                });
              }
            } catch (error) {
              console.error('[CreateBountyForm] Error waiting for transaction', error);
              const errorMsg = error instanceof Error ? error.message : 'Failed to fetch transaction details';
              setTransactionState({
                success: false,
                error: errorMsg,
              });
              toast.error('Transaction failed', { 
                id: 'create-bounty',
                description: errorMsg 
              });
              setIsSubmitting(false);
            }
          },
          onError: (error) => {
            console.error('[CreateBountyForm] Transaction signing failed', error);
            const errorMsg = error.message || 'Transaction failed';
            setTransactionState({
              success: false,
              error: errorMsg,
            });
            toast.error('Transaction signing failed', { 
              id: 'create-bounty',
              description: errorMsg 
            });
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('[CreateBountyForm] Error building transaction', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setTransactionState({
        success: false,
        error: errorMsg,
      });
      toast.error('Failed to build transaction', { 
        id: 'create-bounty',
        description: errorMsg 
      });
      setIsSubmitting(false);
    }
  };

  const addFileEntry = () => {
    const newEntries = [...fileEntries, { fileName: '', blobId: '' }];
    setFileEntries(newEntries);
    setValue('fileNames', newEntries.map(e => e.fileName));
    setValue('blobIds', newEntries.map(e => e.blobId));
    trigger(['fileNames', 'blobIds']);
  };

  const removeFileEntry = (index: number) => {
    const newEntries = fileEntries.filter((_, i) => i !== index);
    setFileEntries(newEntries);
    setValue('fileNames', newEntries.map(e => e.fileName));
    setValue('blobIds', newEntries.map(e => e.blobId));
    trigger(['fileNames', 'blobIds']);
  };

  const updateFileEntry = (index: number, field: 'fileName' | 'blobId', value: string) => {
    const newEntries = [...fileEntries];
    newEntries[index][field] = value;
    setFileEntries(newEntries);
    setValue('fileNames', newEntries.map(e => e.fileName));
    setValue('blobIds', newEntries.map(e => e.blobId));
    trigger(['fileNames', 'blobIds']);
  };

  const addLabel = () => {
    const newLabels = [...labels, ''];
    setLabels(newLabels);
    setValue('allowedLabels', newLabels);
    trigger('allowedLabels');
  };

  const removeLabel = (index: number) => {
    const newLabels = labels.filter((_, i) => i !== index);
    setLabels(newLabels);
    setValue('allowedLabels', newLabels);
    trigger('allowedLabels');
  };

  const updateLabel = (index: number, value: string) => {
    const newLabels = [...labels];
    newLabels[index] = value;
    setLabels(newLabels);
    setValue('allowedLabels', newLabels);
    trigger('allowedLabels');
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <p className="text-zinc-600 dark:text-zinc-400 text-center">
          Please connect your wallet to create a bounty
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
        Create Dataset Bounty
      </h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Bounty Name *
            </label>
            <Tooltip content="A descriptive name for your dataset bounty">
              <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Tooltip>
          </div>
          <input
            id="name"
            type="text"
            autoFocus
            tabIndex={1}
            {...register('name', {
              setValueAs: (v) => v,
              onChange: (e) => {
                nameInputRef.current = e.target;
              }
            })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            placeholder="e.g., Cat vs Dog Classification"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Choose a clear, descriptive name for your labeling task
          </p>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Files (Name & Blob ID) *
            </label>
            <Tooltip content="Add file names and their corresponding Walrus blob IDs">
              <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Tooltip>
          </div>
          <div className="space-y-3">
            {fileEntries.map((entry, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <input
                    value={entry.fileName}
                    onChange={(e) => updateFileEntry(index, 'fileName', e.target.value)}
                    tabIndex={2 + index * 2}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                    placeholder="e.g., image001.jpg"
                    aria-label={`File name ${index + 1}`}
                  />
                </div>
                <div className="flex-1">
                  <input
                    value={entry.blobId}
                    onChange={(e) => updateFileEntry(index, 'blobId', e.target.value)}
                    tabIndex={3 + index * 2}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                    placeholder="Walrus blob ID"
                    aria-label={`Blob ID ${index + 1}`}
                  />
                </div>
                {fileEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFileEntry(index)}
                    className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Remove file entry ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Each file needs a name and its Walrus blob ID. Both lists must have the same length.
          </p>
          {errors.fileNames && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.fileNames.message || (Array.isArray(errors.fileNames) && errors.fileNames[0]?.message)}
            </p>
          )}
          {errors.blobIds && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.blobIds.message || (Array.isArray(errors.blobIds) && errors.blobIds[0]?.message)}
            </p>
          )}
          <button
            type="button"
            onClick={addFileEntry}
            className="mt-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add File
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Allowed Labels *
            </label>
            <Tooltip content="Define the labels that can be used for classification">
              <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Tooltip>
          </div>
          <div className="space-y-2">
            {labels.map((label, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={label}
                  onChange={(e) => updateLabel(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                  placeholder="e.g., cat, dog, bird"
                  aria-label={`Label ${index + 1}`}
                />
                {labels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLabel(index)}
                    className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Remove label ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Add all possible labels that users can choose from when labeling files
          </p>
          {errors.allowedLabels && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.allowedLabels.message || (Array.isArray(errors.allowedLabels) && errors.allowedLabels[0]?.message)}
            </p>
          )}
          <button
            type="button"
            onClick={addLabel}
            className="mt-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add Label
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="totalImages" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Total Images *
            </label>
            <Tooltip content="The total number of images in your dataset">
              <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Tooltip>
          </div>
          <input
            id="totalImages"
            type="number"
            {...register('totalImages', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            placeholder="e.g., 100"
            min="1"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Must be a positive integer
          </p>
          {errors.totalImages && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.totalImages.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="rewardAmount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Reward Amount (SUI) *
            </label>
            <Tooltip content="The amount of SUI tokens to reward for completing the bounty">
              <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Tooltip>
          </div>
          <input
            id="rewardAmount"
            type="number"
            step="0.01"
            {...register('rewardAmount', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            placeholder="e.g., 0.5"
            min="0.01"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Minimum 0.01 SUI. This amount will be split from your wallet.
          </p>
          {errors.rewardAmount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.rewardAmount.message}
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
              Creating Bounty...
            </span>
          ) : 'Create Bounty'}
        </button>
      </form>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Confirm Bounty Creation"
        message={`You are about to create a bounty "${pendingFormData?.name}" with a reward of ${pendingFormData?.rewardAmount} SUI. This will require a transaction signature and gas fees.`}
        confirmText="Create Bounty"
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
