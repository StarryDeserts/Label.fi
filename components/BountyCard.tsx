'use client';

import type { CreateBountyEvent } from '@/types/sui-contract';
import Link from 'next/link';

interface BountyCardProps {
  bounty: CreateBountyEvent;
}

export function BountyCard({ bounty }: BountyCardProps) {
  return (
    <Link href={`/bounty/${bounty.id}`}>
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg cursor-pointer">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {bounty.name}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>{bounty.total_images} images</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>{bounty.allowed_labels.length} labels</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {bounty.allowed_labels.slice(0, 3).map((label, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
            >
              {label}
            </span>
          ))}
          {bounty.allowed_labels.length > 3 && (
            <span className="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400">
              +{bounty.allowed_labels.length - 3} more
            </span>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
            ID: {bounty.id}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-end text-blue-600 dark:text-blue-400 text-sm font-medium">
          View Details
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
