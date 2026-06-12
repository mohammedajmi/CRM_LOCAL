import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Search, User as UserIcon, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Empty } from '../components/ui/Empty';
import { Audit } from '../data/db';

export const AuditTrail: React.FC = () => {
  const all = useMemo(() => Audit.list(), []);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return all;
    const s = q.toLowerCase();
    return all.filter(l =>
      l.changeId.toLowerCase().includes(s) ||
      l.action.toLowerCase().includes(s) ||
      l.user.toLowerCase().includes(s) ||
      l.details.toLowerCase().includes(s)
    );
  }, [all, q]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><History size={22} /> Audit Trail</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length} of {all.length} events</p>
      </div>

      <Card className="p-3 md:p-4">
        <Input
          leftIcon={<Search size={16} />}
          placeholder="Search by request ID, action, user, or details..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <Empty title={all.length === 0 ? 'No audit events yet' : 'No matches'} subtitle="Audit events are recorded automatically when you create or advance change requests." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(log => (
              <div key={log.id} className="p-3 md:p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand">{log.action}</Badge>
                    <Link to={`/cr/${log.changeId}`} className="text-xs font-mono text-brand-600 hover:underline flex items-center gap-1">
                      {log.changeId} <ArrowRight size={11} />
                    </Link>
                  </div>
                  <span className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <UserIcon size={11} /> <strong>{log.user}</strong>
                </div>
                {log.details && <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{log.details}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
