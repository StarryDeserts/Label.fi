'use client';

import { WalletButton } from "@/components/wallet-button";
import { BountyCard } from "@/components/BountyCard";
import { useState, useEffect } from "react";
import { queryCreateBountyEvent } from "@/lib/contract-wrapper";
import type { CreateBountyEvent } from "@/types/sui-contract";
import { toast } from "sonner";
import Link from "next/link";

export default function Home() {
  const [bounties, setBounties] = useState<CreateBountyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBounties();
  }, []);

  const loadBounties = async () => {
    try {
      setLoading(true);
      console.log('[Home] Loading bounties...');
      
      const state = await queryCreateBountyEvent();
      setBounties(state.bountys);
      
      console.log('[Home] Loaded bounties:', state.bountys.length);
    } catch (error) {
      console.error('[Home] Error loading bounties:', error);
      toast.error('Failed to load bounties');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 glass dark:glass-dark border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform">
              Label.fi
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/create">
              <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200">
                Create Bounty
              </button>
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                Dataset Bounties
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-300">
                Browse and contribute to data labeling bounties
              </p>
            </div>
            <button
              onClick={loadBounties}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 glass dark:glass-dark rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="glass dark:glass-dark rounded-2xl p-8 flex items-center gap-3 shadow-lg">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading bounties...</span>
            </div>
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-20">
            <div className="glass dark:glass-dark rounded-3xl p-12 max-w-md mx-auto shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">No bounties yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first bounty.
              </p>
              <Link href="/create">
                <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200">
                  Create Bounty
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
