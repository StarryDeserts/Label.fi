'use client';

import type { CreateBountyEvent } from '@/types/sui-contract';
import Link from 'next/link';

interface BountyCardProps {
  bounty: CreateBountyEvent;
}

export function BountyCard({ bounty }: BountyCardProps) {
  return (
    <Link href={`/bounty/${bounty.id}`}>
      <div className="group relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-xl dark:glass-dark glass border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {bounty.name}
          </h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium">{bounty.total_images} images</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="font-medium">{bounty.allowed_labels.length} labels</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {bounty.allowed_labels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded-md"
              >
                {label}
              </span>
            ))}
            {bounty.allowed_labels.length > 3 && (
              <span className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md">
                +{bounty.allowed_labels.length - 3}
              </span>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono truncate">
              {bounty.id}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-end text-indigo-600 dark:text-indigo-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
            View Details
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
