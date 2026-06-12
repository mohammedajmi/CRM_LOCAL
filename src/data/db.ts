/**
 * Pure-localStorage data layer for the CRM_Local app.
 *
 * All read/write operations are synchronous against window.localStorage.
 * Keys are prefixed with `crm_` so they don't collide with other apps on
 * the same origin. Data is automatically seeded on first read.
 */
import type {
  ChangeRequest, AuditLog, User, WorkflowStep,
  Priority, Department,
} from './types';

const K = {
  users:        'crm_users',
  requests:     'crm_requests',
  auditLogs:    'crm_audit_logs',
  currentUser:  'crm_current_user',
  theme:        'crm_theme',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const now = () => new Date().toISOString();

// ── Seed users ───────────────────────────────────────────────────────────────

export const SEED_USERS: User[] = [
  { id: 'u-admin', name: 'Admin User',       email: 'admin@ohb.co.om', password: 'admin123', role: 'Admin',   department: 'Admin',      avatar: 'AU' },
  { id: 'u-it',    name: 'IT Manager',       email: 'it@ohb.co.om',    password: 'it123',    role: 'Manager', department: 'IT',         avatar: 'IM' },
  { id: 'u-risk',  name: 'Risk Officer',     email: 'risk@ohb.co.om',  password: 'risk123',  role: 'Staff',   department: 'Risk',       avatar: 'RO' },
  { id: 'u-comp',  name: 'Compliance Lead',  email: 'comp@ohb.co.om',  password: 'comp123',  role: 'Staff',   department: 'Compliance', avatar: 'CL' },
  { id: 'u-cab',   name: 'CAB Reviewer',     email: 'cab@ohb.co.om',   password: 'cab123',   role: 'CAB',     department: 'CAB',        avatar: 'CR' },
];

function ensureUsers(): User[] {
  const existing = read<User[]>(K.users, []);
  if (existing.length === 0) {
    write(K.users, SEED_USERS);
    return SEED_USERS;
  }
  return existing;
}

// ── Users ────────────────────────────────────────────────────────────────────

export const Users = {
  list(): User[] {
    return ensureUsers();
  },
  findByEmail(email: string): User | undefined {
    return ensureUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findByName(name: string): User | undefined {
    return ensureUsers().find(u => u.name.toLowerCase() === name.toLowerCase());
  },
};

// ── Change Requests ───────────────────────────────────────────────────────────

export const Requests = {
  list(): ChangeRequest[] {
    return read<ChangeRequest[]>(K.requests, []);
  },
  get(id: string): ChangeRequest | undefined {
    return this.list().find(r => r.id === id);
  },
  create(input: {
    title: string;
    initiator: string;
    department: Department;
    priority: Priority;
    brd: ChangeRequest['brd'];
    workflow: { templateId: string; templateName: string; steps: WorkflowStep[] };
  }): ChangeRequest {
    const all = this.list();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todaysCount = all.filter(r => r.id.startsWith(`CR-${today}`)).length;
    const code = `CR-${today}-${String(todaysCount + 1).padStart(4, '0')}`;

    const cr: ChangeRequest = {
      id: code,
      title: input.title,
      initiator: input.initiator,
      department: input.department,
      status: 'Draft',
      priority: input.priority,
      createdAt: now(),
      updatedAt: now(),
      brd: input.brd,
      workflow: {
        templateId: input.workflow.templateId,
        templateName: input.workflow.templateName,
        currentStepIndex: 0,
        steps: input.workflow.steps.map((s, i) => ({
          ...s,
          status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
        })),
      },
      comments: [],
    };

    write(K.requests, [cr, ...all]);
    Audit.add(cr.id, 'REQUEST_CREATED', cr.initiator, `Change request '${code}' created in Draft state.`);
    return cr;
  },
  update(id: string, patch: Partial<ChangeRequest>): void {
    const all = this.list();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch, updatedAt: now() };
    write(K.requests, all);
  },
  submit(id: string, user: string): void {
    this.update(id, { status: 'Under Review' });
    Audit.add(id, 'REQUEST_SUBMITTED', user, `Submitted for review.`);
  },
  advanceStep(id: string, action: 'COMPLETE' | 'REJECT', user: string, comments: string): void {
    const cr = this.get(id);
    if (!cr) return;
    const idx = cr.workflow.currentStepIndex;
    const step = cr.workflow.steps[idx];
    if (!step) return;

    step.status = action === 'COMPLETE' ? 'COMPLETED' : 'REJECTED';
    step.completedBy = user;
    step.completedAt = now();
    step.comments = comments;

    let newStatus = cr.status;
    let newIndex = idx;

    if (action === 'REJECT') {
      newStatus = 'Rejected';
    } else {
      const next = cr.workflow.steps.findIndex((s, i) => i > idx && s.status === 'PENDING');
      if (next === -1) {
        newStatus = 'Completed';
      } else {
        newIndex = next;
        cr.workflow.steps[next].status = 'IN_PROGRESS';
        if (cr.workflow.steps[next].department === 'Compliance') newStatus = 'Compliance Check';
        else if (cr.workflow.steps[next].type === 'TASK' && cr.workflow.steps[next].department === 'IT') newStatus = 'Implementation';
        else newStatus = 'Under Review';
      }
    }

    cr.workflow.currentStepIndex = newIndex;
    cr.status = newStatus;
    this.update(id, cr);
    Audit.add(id, `STEP_${action}`, user, `${step.name}: ${comments || '(no comment)'}`);
  },
  addComment(id: string, user: string, text: string): void {
    const cr = this.get(id);
    if (!cr) return;
    cr.comments.push({ user, text, date: now() });
    this.update(id, cr);
    Audit.add(id, 'COMMENT_ADDED', user, text.slice(0, 100));
  },
  remove(id: string): void {
    write(K.requests, this.list().filter(r => r.id !== id));
    Audit.add(id, 'REQUEST_DELETED', 'System', 'Request removed.');
  },
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

export const Audit = {
  list(changeId?: string): AuditLog[] {
    const all = read<AuditLog[]>(K.auditLogs, []);
    return changeId ? all.filter(l => l.changeId === changeId) : all;
  },
  add(changeId: string, action: string, user: string, details: string): void {
    const entry: AuditLog = {
      id: uid('log'),
      changeId,
      action,
      user,
      timestamp: now(),
      details,
    };
    write(K.auditLogs, [entry, ...read<AuditLog[]>(K.auditLogs, [])]);
  },
};

// ── Session (current user) ────────────────────────────────────────────────────

export const Session = {
  get(): User | null {
    return read<User | null>(K.currentUser, null);
  },
  set(user: User): void {
    write(K.currentUser, user);
  },
  clear(): void {
    localStorage.removeItem(K.currentUser);
  },
};

// ── Theme ────────────────────────────────────────────────────────────────────

export const Theme = {
  get(): 'light' | 'dark' {
    const stored = localStorage.getItem(K.theme);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  set(t: 'light' | 'dark'): void {
    localStorage.setItem(K.theme, t);
  },
};

// ── Reset (dev helper) ────────────────────────────────────────────────────────

export const DB = {
  reset(): void {
    Object.values(K).forEach(k => localStorage.removeItem(k));
  },
  stats() {
    const requests = Requests.list();
    return {
      total:       requests.length,
      draft:       requests.filter(r => r.status === 'Draft').length,
      review:      requests.filter(r => r.status === 'Under Review' || r.status === 'Compliance Check').length,
      approved:    requests.filter(r => r.status === 'Approved' || r.status === 'Implementation').length,
      completed:   requests.filter(r => r.status === 'Completed').length,
      rejected:    requests.filter(r => r.status === 'Rejected').length,
      critical:    requests.filter(r => r.priority === 'Critical' && r.status !== 'Completed' && r.status !== 'Rejected').length,
    };
  },
};
