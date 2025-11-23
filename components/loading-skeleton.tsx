'use client';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FormSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      <LoadingSkeleton className="h-8 w-48" />
      
      <div className="space-y-4">
        <div>
          <LoadingSkeleton className="h-4 w-24 mb-2" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
        
        <div>
          <LoadingSkeleton className="h-4 w-32 mb-2" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
        
        <div>
          <LoadingSkeleton className="h-4 w-28 mb-2" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
        
        <LoadingSkeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
