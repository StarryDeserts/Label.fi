'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WalletButton } from '@/components/wallet-button';
import { queryStakePoolInfo, queryDatabaseData, submitLabelTransaction } from '@/lib/contract-wrapper';
import type { DatasetBounty } from '@/types/sui-contract';
import { toast } from 'sonner';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet-context';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const submitLabelSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  label: z.string().min(1, 'Label is required'),
});

type SubmitLabelFormData = z.infer<typeof submitLabelSchema>;

export default function BountyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bountyId = params.id as string;
  
  const { address, isConnected } = useWallet();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [bounty, setBounty] = useState<DatasetBounty | null>(null);
  const [files, setFiles] = useState<Array<{ name: string; blobId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<SubmitLabelFormData>({
    resolver: zodResolver(submitLabelSchema),
    mode: 'onChange',
    defaultValues: {
      fileName: '',
      label: '',
    },
  });

  const fileName = watch('fileName');

  useEffect(() => {
    loadBountyDetails();
  }, [bountyId]);

  useEffect(() => {
    if (fileName) {
      const file = files.find(f => f.name === fileName);
      setSelectedFile(file?.blobId || '');
    }
  }, [fileName, files]);

  const loadBountyDetails = async () => {
    try {
      setLoading(true);
      console.log('[BountyDetail] Loading bounty details:', bountyId);
      
      // 1. 查询 bounty 详细信息
      const bountyInfo = await queryStakePoolInfo(bountyId);
      setBounty(bountyInfo);
      console.log('[BountyDetail] Bounty info:', bountyInfo);
      
      // 2. 查询文件列表
      const walrusBlobId = bountyInfo.walrus_bolb_ids.fields.id.id;
      const databaseData = await queryDatabaseData(walrusBlobId);
      console.log('[BountyDetail] Database data:', databaseData);
      
      // 3. 解析文件列表
      const fileList = databaseData.data.map((item: any) => ({
        name: item.value.fields.name,
        blobId: item.value.fields.value,
      }));
      setFiles(fileList);
      
      toast.success('Bounty details loaded');
    } catch (error) {
      console.error('[BountyDetail] Error loading bounty details:', error);
      toast.error('Failed to load bounty details');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SubmitLabelFormData) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Submitting label...', { id: 'submit-label' });

    try {
      console.log('[BountyDetail] Submitting label:', data);
      
      const tx = await submitLabelTransaction(bountyId, data.fileName, data.label);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            try {
              console.log('[BountyDetail] Transaction signed:', result.digest);
              
              const txResponse = await suiClient.waitForTransaction({
                digest: result.digest,
                options: {
                  showEffects: true,
                  showEvents: true,
                  showObjectChanges: true,
                },
              });
              
              const success = txResponse.effects?.status?.status === 'success';
              
              if (success) {
                toast.success('Label submitted successfully!', { id: 'submit-label' });
                reset();
                // 重新加载 bounty 详情以更新完成数量
                loadBountyDetails();
              } else {
                const errorMsg = txResponse.effects?.status?.error || 'Transaction failed';
                toast.error('Label submission failed', { 
                  id: 'submit-label',
                  description: errorMsg 
                });
              }
              setIsSubmitting(false);
            } catch (error) {
              console.error('[BountyDetail] Error waiting for transaction:', error);
              toast.error('Transaction failed', { id: 'submit-label' });
              setIsSubmitting(false);
            }
          },
          onError: (error) => {
            console.error('[BountyDetail] Transaction signing failed:', error);
            toast.error('Transaction signing failed', { id: 'submit-label' });
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('[BountyDetail] Error building transaction:', error);
      toast.error('Failed to build transaction', { id: 'submit-label' });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                DataPact
              </h1>
            </Link>
            <WalletButton />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-zinc-600 dark:text-zinc-400">Loading bounty details...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                DataPact
              </h1>
            </Link>
            <WalletButton />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Bounty not found</h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              The bounty you're looking for doesn't exist.
            </p>
            <div className="mt-6">
              <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors inline-block">
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Label.fi
            </h1>
          </Link>
          <WalletButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Bounties
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Bounty details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                {bounty.name}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Images</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {bounty.total_images}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Completed</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {bounty.completed_counts}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Reward Pool</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {(bounty.reward_pool / 1_000_000_000).toFixed(4)} SUI
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Progress</p>
                  <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {Math.round((bounty.completed_counts / bounty.total_images) * 100)}%
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Allowed Labels
                </h3>
                <div className="flex flex-wrap gap-2">
                  {bounty.allowed_labels.map((label, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Bounty ID
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono break-all">
                  {bountyId}
                </p>
              </div>
            </div>

            {/* Files list */}
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700"
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1 truncate">
                      Blob: {file.blobId}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Submit label form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Submit Label
              </h3>

              {!isConnected ? (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Please connect your wallet to submit labels
                </p>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="fileName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      File Name *
                    </label>
                    <select
                      id="fileName"
                      {...register('fileName')}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a file</option>
                      {files.map((file, index) => (
                        <option key={index} value={file.name}>
                          {file.name}
                        </option>
                      ))}
                    </select>
                    {errors.fileName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.fileName.message}
                      </p>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                      <p className="text-blue-700 dark:text-blue-300 font-mono break-all">
                        Blob: {selectedFile}
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="label" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Label *
                    </label>
                    <select
                      id="label"
                      {...register('label')}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a label</option>
                      {bounty.allowed_labels.map((label, index) => (
                        <option key={index} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {errors.label && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.label.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : 'Submit Label'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
