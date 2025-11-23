'use client';

import { WalletButton } from "@/components/wallet-button";
import { CreateBountyForm } from "@/components/CreateBountyForm";
import { SubmitLabelForm } from "@/components/submit-label-form";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'create' | 'submit'>('create');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            DataPact
          </h1>
          <WalletButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm ${activeTab === 'create' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-600'}`}
              >
                Create Bounty
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm ${activeTab === 'submit' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-600'}`}
              >
                Submit Label
              </button>
            </nav>
          </div>

          {activeTab === 'create' ? <CreateBountyForm /> : <SubmitLabelForm />}
        </div>
      </main>
    </div>
  );
}
