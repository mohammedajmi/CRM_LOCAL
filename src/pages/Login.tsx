import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User as UserIcon, Lock, LogIn, AlertCircle, Users, Zap, Moon, Sun } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { login, quickLogin, getCurrentUser } from '../data/auth';
import { Users as UsersDB, Theme } from '../data/db';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [emailOrName, setEmailOrName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState<boolean>(() => Theme.get() === 'dark');

  const seedUsers = UsersDB.list();

  // Redirect if already signed in
  useEffect(() => {
    if (getCurrentUser()) navigate('/', { replace: true });
  }, [navigate]);

  // Apply dark mode at login page level too
  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add('dark'); Theme.set('dark'); }
    else      { root.classList.remove('dark'); Theme.set('light'); }
  }, [dark]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      login(emailOrName, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const oneClick = (u: typeof seedUsers[number]) => {
    setError(null);
    setLoading(true);
    try {
      quickLogin(u);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 flex items-center justify-center p-4 relative">
      <button
        onClick={() => setDark(!dark)}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
        title={dark ? 'Light mode' : 'Dark mode'}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(77,161,164,0.25),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(145,95,70,0.2),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Brand */}
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 shadow-glow">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold">FinTrust CRM</h1>
          <p className="text-brand-300 text-sm mt-1">Change Management System · Oman Housing Bank</p>
        </div>

        {/* Login card */}
        <Card className="p-5 md:p-7 border-0 shadow-2xl">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm border border-red-200 dark:border-red-800">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Username or Email"
              leftIcon={<UserIcon size={16} />}
              value={emailOrName}
              onChange={e => setEmailOrName(e.target.value)}
              placeholder="admin@ohb.co.om"
              autoComplete="username"
              required
            />
            <Input
              label="Password"
              type="password"
              leftIcon={<Lock size={16} />}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <Button type="submit" fullWidth isLoading={loading} leftIcon={!loading && <LogIn size={16} />}>
              Sign In
            </Button>
          </form>
        </Card>

        {/* Quick login panel */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="px-4 md:px-5 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50/80 dark:bg-slate-900/40">
            <Users size={14} className="text-brand-500" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider">
              Quick Login (Dev Mode)
            </h3>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">
              <Zap size={10} /> Local
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {seedUsers.map(u => (
              <button
                key={u.id}
                onClick={() => oneClick(u)}
                disabled={loading}
                className="w-full text-left px-4 md:px-5 py-2.5 flex items-center gap-3 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors group disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:bg-brand-200 group-hover:text-brand-700 transition-colors">
                  {u.avatar || u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge variant="brand">{u.role}</Badge>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{u.email}</span>
                  </div>
                </div>
                <Zap size={14} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </Card>

        <p className="text-center text-xs text-brand-300/70">
          Pure-localStorage build — no backend, no DB. Your data stays in this browser.
        </p>
      </div>
    </div>
  );
};
