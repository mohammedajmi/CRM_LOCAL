import React from 'react';
import { Inbox } from 'lucide-react';

export const Empty: React.FC<{ title?: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode }> = ({
  title = 'Nothing here yet',
  subtitle = 'Create the first record to get started.',
  icon,
  action,
}) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-slate-500 dark:text-slate-400">
    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
      {icon || <Inbox size={26} />}
    </div>
    <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</p>
    <p className="text-sm mt-1 max-w-sm">{subtitle}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
