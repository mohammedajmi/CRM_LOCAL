import React from 'react';

type Variant = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const variantClasses: Record<Variant, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  brand:   'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  accent:  'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  danger:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  info:    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
};

interface BadgeProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className = '', children }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${variantClasses[variant]} ${className}`}>
    {children}
  </span>
);

// Helper: map status / priority strings to a variant
export function statusVariant(status: string): Variant {
  switch (status) {
    case 'Completed':       return 'success';
    case 'Rejected':        return 'danger';
    case 'Approved':
    case 'Implementation':  return 'brand';
    case 'Under Review':
    case 'Compliance Check': return 'warning';
    case 'Draft':           return 'neutral';
    default:                return 'neutral';
  }
}

export function priorityVariant(priority: string): Variant {
  switch (priority) {
    case 'Critical': return 'danger';
    case 'High':     return 'warning';
    case 'Medium':   return 'info';
    case 'Low':      return 'success';
    default:         return 'neutral';
  }
}
