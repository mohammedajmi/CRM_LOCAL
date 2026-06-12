import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, ArrowRight } from 'lucide-react';
import { Requests } from '../data/db';
import type { ChangeStatus, Priority } from '../data/types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge, priorityVariant, statusVariant } from '../components/ui/Badge';
import { Empty } from '../components/ui/Empty';

const STATUS_OPTIONS: ('All' | ChangeStatus)[] = ['All', 'Draft', 'Under Review', 'Compliance Check', 'Approved', 'Implementation', 'Completed', 'Rejected'];
const PRIORITY_OPTIONS: ('All' | Priority)[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

export const ChangeRequests: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All' | ChangeStatus>('All');
  const [priority, setPriority] = useState<'All' | Priority>('All');
  const all = useMemo(() => Requests.list(), []);

  const filtered = useMemo(() => {
    return all.filter(r => {
      if (status !== 'All' && r.status !== status) return false;
      if (priority !== 'All' && r.priority !== priority) return false;
      if (search) {
        const s = search.toLowerCase();
        return r.title.toLowerCase().includes(s) || r.id.toLowerCase().includes(s) || r.initiator.toLowerCase().includes(s);
      }
      return true;
    });
  }, [all, search, status, priority]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Change Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length} of {all.length} requests</p>
        </div>
        <Link to="/new">
          <Button leftIcon={<Plus size={16} />}>New Change Request</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px] gap-3">
          <Input
            leftIcon={<Search size={16} />}
            placeholder="Search by title, ID, or initiator..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select
            options={STATUS_OPTIONS.map(s => ({ value: s, label: s === 'All' ? 'All statuses' : s }))}
            value={status}
            onChange={e => setStatus(e.target.value as any)}
          />
          <Select
            options={PRIORITY_OPTIONS.map(p => ({ value: p, label: p === 'All' ? 'All priorities' : p }))}
            value={priority}
            onChange={e => setPriority(e.target.value as any)}
          />
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <Empty
            title="No requests match your filters"
            subtitle={all.length === 0 ? 'Create the first change request to get started.' : 'Try adjusting your search or filters.'}
            icon={<Filter size={26} />}
            action={all.length === 0 ? (
              <Link to="/new"><Button leftIcon={<Plus size={16} />}>New Change Request</Button></Link>
            ) : undefined}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(r => (
              <Link
                key={r.id}
                to={`/cr/${r.id}`}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group"
              >
                <div className="hidden sm:flex w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 items-center justify-center font-bold text-sm shrink-0">
                  {r.priority.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400 truncate">{r.id}</span>
                    <Badge variant={priorityVariant(r.priority)}>{r.priority}</Badge>
                  </div>
                  <div className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{r.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    by {r.initiator} · {r.department}
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  <span className="text-[11px] text-slate-400">{new Date(r.updatedAt).toLocaleDateString()}</span>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
