import React from 'react';

// Generic skeleton components for consistent loading states
export const Skeleton: React.FC<{ 
  className?: string; 
  width?: string; 
  height?: string;
}> = ({ className = "", width, height }) => {
  const style = {
    ...(width && { width }),
    ...(height && { height })
  };
  
  return (
    <div 
      className={`skeleton rounded ${className}`} 
      style={style}
    />
  );
};

// Pre-configured skeleton components for common patterns
export const SkeletonText: React.FC<{ 
  lines?: number; 
  className?: string;
}> = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ 
  className?: string;
  showAvatar?: boolean;
}> = ({ className = "", showAvatar = false }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
    <div className="flex items-start space-x-4">
      {showAvatar && (
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      )}
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
      <div className="flex space-x-8">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="flex space-x-8">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={`h-4 ${colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-16' : 'w-24'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonButton: React.FC<{ 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className = "", size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-16',
    md: 'h-10 w-20',
    lg: 'h-12 w-24'
  };
  
  return (
    <Skeleton className={`${sizeClasses[size]} rounded-lg ${className}`} />
  );
};

// Page-level skeleton layouts
export const DashboardSkeleton: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex space-x-3">
        <SkeletonButton size="md" />
        <SkeletonButton size="sm" />
      </div>
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SkeletonTable rows={6} columns={5} />
      </div>
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ 
  items?: number;
  showFilters?: boolean;
}> = ({ items = 8, showFilters = true }) => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <SkeletonButton />
    </div>
    
    {/* Filters */}
    {showFilters && (
      <div className="flex space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    )}
    
    {/* List */}
    <SkeletonTable rows={items} columns={6} />
  </div>
);

export default {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonButton,
  DashboardSkeleton,
  ListSkeleton
};