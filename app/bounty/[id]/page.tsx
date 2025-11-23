'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WalletButton } from '@/components/wallet-button';
import { queryStakePoolInfo, queryDatabaseData, queryDynamicField, submitLabelTransaction } from '@/lib/contract-wrapper';
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
      console.log('[walrusBlobId] data:', walrusBlobId);
      const databaseData = await queryDatabaseData(walrusBlobId);
      console.log('[BountyDetail] Database data:', databaseData);
      
      // 3. 解析文件列表 - 获取每个 objectId 的详细信息
      const fileList = await Promise.all(
        databaseData.data.map(async (item: any) => {
          try {
            const objectId = item.objectId;
            console.log('[BountyDetail] Fetching dynamic field for objectId:', objectId);
            
            const fieldData = await queryDynamicField(objectId);
            console.log('[BountyDetail] Field data:', fieldData);
            
            // queryDynamicField 返回的是 DynamicField 类型
            return {
              name: fieldData.name,
              blobId: fieldData.value,
            };
          } catch (error) {
            console.error('[BountyDetail] Error fetching field data:', error);
            return {
              name: item.name?.value || 'Unknown',
              blobId: 'Unknown',
            };
          }
        })
      );
      
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header className="sticky top-0 z-50 glass dark:glass-dark border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform">
                Label.fi
              </h1>
            </Link>
            <WalletButton />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="glass dark:glass-dark rounded-xl p-8 flex items-center gap-3 shadow-lg border border-gray-200 dark:border-gray-700">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading bounty details...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <header className="sticky top-0 z-50 glass dark:glass-dark border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform">
                Label.fi
              </h1>
            </Link>
            <WalletButton />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="glass dark:glass-dark rounded-xl p-12 max-w-md mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Bounty not found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The bounty you're looking for doesn't exist.
              </p>
              <Link href="/" className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200">
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="sticky top-0 z-50 glass dark:glass-dark border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform">
              Label.fi
            </h1>
          </Link>
          <WalletButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Bounties</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Bounty details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass dark:glass-dark rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                {bounty.name}
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Images</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {bounty.total_images}
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {bounty.completed_counts}
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Reward Pool</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {(bounty.reward_pool / 1_000_000_000).toFixed(4)} SUI
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Progress</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round((bounty.completed_counts / bounty.total_images) * 100)}%
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Labels
                </h3>
                <div className="flex flex-wrap gap-2">
                  {bounty.allowed_labels.map((label, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-medium bg-indigo-600 text-white rounded-md"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Bounty ID
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                  {bountyId}
                </p>
              </div>
            </div>

            {/* Files list - Scrollable */}
            <div className="glass dark:glass-dark rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-4">
                Files ({files.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {files.map((file, index) => {
                  console.log('[FilePreview] Rendering file:', file.name, 'blobId:', file.blobId);
                  return (
                    <div
                      key={index}
                      className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="relative w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                        <img
                          src={file.blobId}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoad={(e) => {
                            console.log('[FilePreview] Image loaded successfully:', file.name);
                          }}
                          onError={(e) => {
                            console.error('[FilePreview] Image failed to load:', file.name, file.blobId);
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23e4e4e7" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23a1a1aa" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <a
                            href={file.blobId}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-gray-50 rounded-lg text-xs font-semibold pointer-events-auto hover:bg-indigo-600 hover:text-white transition-colors"
                          >
                            View Full
                          </a>
                        </div>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-800">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-50 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column - Submit label form */}
          <div className="lg:col-span-1">
            <div className="glass dark:glass-dark rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 sticky top-20">
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Submit Label
              </h3>

              {!isConnected ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
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
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-md">
                      <img
                        src={selectedFile}
                        alt="Selected file preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23e4e4e7" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23a1a1aa" text-anchor="middle" dominant-baseline="middle"%3ENo Preview%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="label" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Label *
                    </label>
                    <select
                      id="label"
                      {...register('label')}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                    className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
