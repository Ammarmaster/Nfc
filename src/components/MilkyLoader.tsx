import React from 'react';

interface MilkySpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
}

export const MilkySpinner: React.FC<MilkySpinnerProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2.5',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/20 to-amber-600/20 blur-md animate-pulse" />
        
        {/* Main spinning ring */}
        <div
          className={`${sizeMap[size]} rounded-full border-amber-200/40 border-t-amber-500 border-r-amber-600 animate-spin`}
        />
        
        {/* Inner reverse spinner */}
        <div
          className="absolute w-1/2 h-1/2 rounded-full border border-emerald-400/50 border-b-transparent animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
        />
      </div>
      {label && (
        <span className="text-xs font-medium text-stone-600 tracking-wide animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

interface MilkySkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const MilkySkeleton: React.FC<MilkySkeletonProps> = ({
  className = '',
  variant = 'rect',
}) => {
  const roundedClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded-md h-4'
      : 'rounded-2xl';

  return (
    <div
      className={`relative overflow-hidden bg-stone-200/60 ${roundedClass} ${className}`}
    >
      {/* Moving shimmer gleam */}
      <div className="absolute inset-0 -translate-x-full animate-[milky-shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
};

export const MilkyCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-3xl bg-white/75 border border-[#E8E2D5] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <MilkySkeleton className="w-24 h-6" />
        <MilkySkeleton className="w-16 h-5 rounded-full" />
      </div>
      <MilkySkeleton className="w-3/4 h-4" />
      <div className="pt-2 flex items-center gap-2">
        <MilkySkeleton className="w-20 h-8 rounded-xl" />
        <MilkySkeleton className="w-20 h-8 rounded-xl" />
      </div>
    </div>
  );
};
