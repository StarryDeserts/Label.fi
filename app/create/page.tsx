'use client';

import { WalletButton } from "@/components/wallet-button";
import { CreateBountyForm } from "@/components/CreateBountyForm";
import Link from "next/link";

export default function CreateBountyPage() {
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Bounties
            </Link>
          </div>
          <CreateBountyForm />
        </div>
      </main>
    </div>
  );
}
