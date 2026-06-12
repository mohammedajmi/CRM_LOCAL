import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, BarChart3, ShieldAlert,
  Bell, ChevronDown, LogOut, Moon, Sun, Menu, X,
  Database, ZapOff, Mail,
} from 'lucide-react';
import { getCurrentUser, logout, onAuthChange } from '../data/auth';
import { Theme } from '../data/db';
import type { User } from '../data/types';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'mohammed.alajmi@ohb.co.om';

const NAV_SECTIONS: { heading?: string; links: { to: string; label: string; icon: React.ReactNode; end?: boolean }[] }[] = [
  {
    links: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
    ],
  },
  {
    heading: 'Change Management',
    links: [
      { to: '/change-requests', label: 'Change Requests', icon: <ListChecks size={18} /> },
    ],
  },
  {
    heading: 'Insights',
    links: [
      { to: '/audit',  label: 'Audit Trail',  icon: <BarChart3 size={18} /> },
    ],
  },
];

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(() => Theme.get() === 'dark');

  // Auth subscription
  useEffect(() => onAuthChange((u) => {
    setUser(u);
    if (!u) navigate('/login', { replace: true });
  }), [navigate]);

  // Auth guard
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  // Dark mode application
  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add('dark'); Theme.set('dark'); }
    else      { root.classList.remove('dark'); Theme.set('light'); }
  }, [dark]);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (!user) return null;

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-brand-900 text-white flex flex-col shadow-2xl
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-brand-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center font-bold text-white shadow-md">
              FT
            </div>
            <div className="leading-tight">
              <div className="font-bold text-base">FinTrust</div>
              <div className="text-[10px] text-brand-300 uppercase tracking-wider">Change Mgmt</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-brand-200 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i} className="mb-2">
              {section.heading && (
                <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
                  {section.heading}
                </div>
              )}
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-brand-800 hover:text-white'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer / Profile */}
        <div className="p-3 border-t border-brand-800 space-y-2">
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-brand-800 hover:text-white transition-colors"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-brand-800 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center font-bold text-sm border-2 border-brand-600">
                {user.avatar || user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name}</div>
                <div className="text-xs text-brand-300 truncate">{user.role} · {user.department}</div>
              </div>
              <ChevronDown size={14} className="text-brand-300" />
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-brand-800 border border-brand-700 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
              <Menu size={20} />
            </button>
            <h1 className="text-base md:text-lg font-semibold truncate">Change Management</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-800">
              <ZapOff size={11} /> Local-only
            </span>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {/* Offline banner */}
          <div className="flex flex-wrap items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 md:px-8 py-2 text-xs text-amber-800 dark:text-amber-300">
            <Database size={13} className="shrink-0" />
            <span>
              <strong>Offline mode</strong> — all data is stored in your browser. Nothing is sent to a server.
            </span>
            <a
              href={`mailto:${ADMIN_EMAIL}`}
              className="ml-auto flex items-center gap-1 hover:underline"
            >
              <Mail size={11} />
              {ADMIN_EMAIL}
            </a>
          </div>
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
