import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  FileText, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp,
  ArrowRight, Plus, Activity,
} from 'lucide-react';
import { Requests } from '../data/db';
import type { ChangeRequest } from '../data/types';
import { Card } from '../components/ui/Card';
import { Badge, priorityVariant, statusVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Empty } from '../components/ui/Empty';

const STATUS_COLORS: Record<string, string> = {
  'Draft':            '#94a3b8',
  'Under Review':     '#2d7275',
  'Compliance Check': '#eab308',
  'Approved':         '#0ea5e9',
  'Implementation':   '#915f46',
  'Completed':        '#22c55e',
  'Rejected':         '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Critical': '#ef4444',
  'High':     '#f97316',
  'Medium':   '#eab308',
  'Low':      '#22c55e',
};

function monthLabel(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear().toString().slice(2)}`;
}

const KpiCard: React.FC<{
  label: string; value: number; tone: 'brand' | 'amber' | 'emerald' | 'red' | 'slate' | 'accent';
  icon: React.ReactNode; href?: string;
}> = ({ label, value, tone, icon, href }) => {
  const toneClasses = {
    brand:   'from-brand-600 to-brand-700 text-white',
    amber:   'from-amber-500 to-amber-600 text-white',
    emerald: 'from-emerald-500 to-emerald-600 text-white',
    red:     'from-red-500 to-red-600 text-white',
    slate:   'from-slate-600 to-slate-700 text-white',
    accent:  'from-accent-500 to-accent-600 text-white',
  }[tone];
  const inner = (
    <Card className={`p-4 md:p-5 border-0 bg-gradient-to-br ${toneClasses} shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className="opacity-80">{icon}</span>
        {href && <ArrowRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />}
      </div>
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider opacity-80 mt-1">{label}</div>
    </Card>
  );
  return href ? <Link to={href} className="block group">{inner}</Link> : inner;
};

export const Dashboard: React.FC = () => {
  const requests = useMemo(() => Requests.list(), []);

  const stats = useMemo(() => {
    const active = requests.filter(r => r.status !== 'Completed' && r.status !== 'Rejected');
    return {
      total:     requests.length,
      active:    active.length,
      pending:   active.filter(r => r.status === 'Under Review' || r.status === 'Compliance Check').length,
      critical:  active.filter(r => r.priority === 'Critical').length,
      completed: requests.filter(r => r.status === 'Completed').length,
      rejected:  requests.filter(r => r.status === 'Rejected').length,
    };
  }, [requests]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || '#94a3b8' }));
  }, [requests]);

  const priorityData = useMemo(() => {
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    return priorities.map(p => ({
      name: p,
      value: requests.filter(r => r.priority === p).length,
      color: PRIORITY_COLORS[p],
    }));
  }, [requests]);

  const trendData = useMemo(() => {
    const months: Record<string, { month: string; created: number; completed: number }> = {};
    requests.forEach(r => {
      const key = monthLabel(r.createdAt);
      if (!months[key]) months[key] = { month: key, created: 0, completed: 0 };
      months[key].created++;
      if (r.status === 'Completed') months[key].completed++;
    });
    return Object.values(months).slice(-6);
  }, [requests]);

  const recent: ChangeRequest[] = useMemo(
    () => [...requests].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [requests]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero */}
      <Card className="border-0 overflow-hidden bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80 mb-1">
              <Activity size={14} className="animate-pulse" />
              Change Management Overview
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-brand-100 text-sm mt-1">All your change requests, audit-ready, in one view.</p>
          </div>
          <Link to="/new">
            <Button variant="secondary" leftIcon={<Plus size={16} />} className="bg-white/15 text-white border-white/20 hover:bg-white/25">
              New Change Request
            </Button>
          </Link>
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <KpiCard label="Total Active"   value={stats.active}    tone="brand"   icon={<FileText size={20} />} href="/change-requests" />
        <KpiCard label="Pending Review" value={stats.pending}   tone="amber"   icon={<Clock size={20} />} href="/change-requests" />
        <KpiCard label="Critical"       value={stats.critical}  tone="red"     icon={<AlertTriangle size={20} />} href="/change-requests" />
        <KpiCard label="Completed"      value={stats.completed} tone="emerald" icon={<CheckCircle size={20} />} href="/change-requests" />
        <KpiCard label="Rejected"       value={stats.rejected}  tone="slate"   icon={<XCircle size={20} />} href="/change-requests" />
        <KpiCard label="All Requests"   value={stats.total}     tone="accent"  icon={<TrendingUp size={20} />} href="/change-requests" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Status distribution</h3>
          {statusData.length === 0 ? (
            <Empty title="No change requests yet" subtitle="Once you create requests, status breakdown will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">By priority</h3>
          {priorityData.every(d => d.value === 0) ? (
            <Empty title="No data" subtitle="Priorities will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Trend + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-4 md:p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Monthly trend</h3>
          {trendData.length === 0 ? (
            <Empty title="No trend yet" subtitle="Create requests to see monthly activity." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d7275" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2d7275" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="created"  stroke="#2d7275" fill="url(#g1)" strokeWidth={2} name="Created" />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#g2)" strokeWidth={2} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent activity</h3>
            <Link to="/change-requests" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <Empty title="No requests yet" subtitle="Click 'New Change Request' to start." />
          ) : (
            <div className="space-y-2">
              {recent.map(r => (
                <Link
                  key={r.id}
                  to={`/cr/${r.id}`}
                  className="block p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-mono text-slate-400 truncate">{r.id}</div>
                    <Badge variant={priorityVariant(r.priority)}>{r.priority}</Badge>
                  </div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">{r.title}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    <span className="text-[11px] text-slate-400">{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
