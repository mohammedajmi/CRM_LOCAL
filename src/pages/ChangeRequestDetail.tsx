import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Send, CheckCircle, XCircle, Clock, MessageSquare,
  GitMerge, FileText, ShieldCheck, AlertTriangle, History, User as UserIcon,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { Badge, priorityVariant, statusVariant } from '../components/ui/Badge';
import { Empty } from '../components/ui/Empty';
import { Requests, Audit } from '../data/db';
import { getCurrentUser } from '../data/auth';
import type { WorkflowStep } from '../data/types';

const stepIcon = (s: WorkflowStep) => {
  switch (s.status) {
    case 'COMPLETED':   return <CheckCircle size={16} className="text-emerald-500" />;
    case 'REJECTED':    return <XCircle size={16} className="text-red-500" />;
    case 'IN_PROGRESS': return <Clock size={16} className="text-amber-500 animate-pulse" />;
    default:            return <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />;
  }
};

export const ChangeRequestDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [request, setRequest] = useState(() => Requests.get(id));
  const [auditLogs, setAuditLogs] = useState(() => Audit.list(id));
  const [stepComment, setStepComment] = useState('');
  const [newComment, setNewComment] = useState('');

  const refresh = () => {
    setRequest(Requests.get(id));
    setAuditLogs(Audit.list(id));
  };

  if (!request) {
    return (
      <Card className="p-6">
        <Empty title="Not found" subtitle={`No change request with ID ${id}.`} />
        <div className="text-center mt-4">
          <Link to="/change-requests"><Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back to list</Button></Link>
        </div>
      </Card>
    );
  }

  const currentStep = request.workflow.steps[request.workflow.currentStepIndex];
  const canActOnStep = !!currentUser
    && (request.status === 'Under Review' || request.status === 'Compliance Check' || request.status === 'Implementation' || request.status === 'Approved')
    && currentStep
    && (currentStep.status === 'IN_PROGRESS' || currentStep.status === 'PENDING');

  const submit = () => {
    if (!currentUser) return;
    Requests.submit(request.id, currentUser.name);
    refresh();
  };

  const advance = (action: 'COMPLETE' | 'REJECT') => {
    if (!currentUser || !currentStep) return;
    if (action === 'REJECT' && !stepComment.trim()) {
      alert('Please add a comment when rejecting.');
      return;
    }
    Requests.advanceStep(request.id, action, currentUser.name, stepComment);
    setStepComment('');
    refresh();
  };

  const addComment = () => {
    if (!currentUser || !newComment.trim()) return;
    Requests.addComment(request.id, currentUser.name, newComment.trim());
    setNewComment('');
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/change-requests')} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">{request.id}</span>
            <Badge variant={priorityVariant(request.priority)}>{request.priority}</Badge>
            <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold mt-1">{request.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            by {request.initiator} · {request.department} · created {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
        {request.status === 'Draft' && (
          <Button leftIcon={<Send size={16} />} onClick={submit}>Submit for review</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* BRD */}
          <Card className="p-4 md:p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
              <FileText size={16} /> Business Requirements Document
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase text-slate-400 mb-1">Problem statement</div>
                <p className="text-slate-700 dark:text-slate-300">{request.brd.problemStatement || '—'}</p>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400 mb-1">Proposed solution</div>
                <p className="text-slate-700 dark:text-slate-300">{request.brd.proposedSolution || '—'}</p>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400 mb-1">Area of change</div>
                <p className="text-slate-700 dark:text-slate-300">{request.brd.areaOfChange || '—'}</p>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400 mb-1">Regulatory compliance</div>
                <p className="text-slate-700 dark:text-slate-300">{request.brd.regulatoryCompliance || '—'}</p>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400 mb-1">Operational risk</div>
                <p className="text-slate-700 dark:text-slate-300">{request.brd.operationalRisk || '—'}</p>
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400 mb-1">Finance review</div>
                <p className="text-slate-700 dark:text-slate-300">{request.brd.financeReview || '—'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 text-xs">
              {request.brd.reportsRequired && <Badge variant="info">Reports required</Badge>}
              {request.brd.auditRequired && <Badge variant="warning">Audit required</Badge>}
              {request.brd.processReengineeringNeeded && <Badge variant="accent">Process re-engineering</Badge>}
            </div>
            {request.brd.requirementsList.length > 0 && (
              <div className="mt-4">
                <div className="text-xs uppercase text-slate-400 mb-2">Functional requirements</div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {request.brd.requirementsList.map((r, i) => <li key={i}>{r}</li>)}
                </ol>
              </div>
            )}
          </Card>

          {/* Comments */}
          <Card className="p-4 md:p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              <MessageSquare size={16} /> Comments ({request.comments.length})
            </h2>
            <div className="space-y-3 mb-4">
              {request.comments.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No comments yet.</p>
              ) : request.comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {c.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-200">{c.user}</strong> · {new Date(c.date).toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
              />
              <Button onClick={addComment} disabled={!newComment.trim()} className="self-end">Post</Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Workflow */}
          <Card className="p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              <GitMerge size={16} /> Workflow
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{request.workflow.templateName}</p>
            <ol className="space-y-3">
              {request.workflow.steps.map((s, i) => (
                <li key={s.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    {stepIcon(s)}
                    {i < request.workflow.steps.length - 1 && (
                      <div className={`w-px h-6 mt-1 ${s.status === 'COMPLETED' ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${s.status === 'IN_PROGRESS' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{s.department} · {s.type}</div>
                    {s.completedBy && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        {s.status === 'COMPLETED' ? '✓' : s.status === 'REJECTED' ? '✗' : '•'} {s.completedBy} · {new Date(s.completedAt || '').toLocaleDateString()}
                      </div>
                    )}
                    {s.comments && (
                      <div className="text-xs italic text-slate-500 dark:text-slate-400 mt-0.5">"{s.comments}"</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {/* Step action panel */}
            {canActOnStep && (
              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Action required
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                  Currently on: <strong>{currentStep!.name}</strong> ({currentStep!.department})
                </p>
                <Textarea
                  value={stepComment}
                  onChange={e => setStepComment(e.target.value)}
                  placeholder="Optional comment for this step..."
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" leftIcon={<CheckCircle size={14} />} onClick={() => advance('COMPLETE')} fullWidth>
                    Complete
                  </Button>
                  <Button size="sm" variant="danger" leftIcon={<XCircle size={14} />} onClick={() => advance('REJECT')} fullWidth>
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Audit */}
          <Card className="p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              <History size={16} /> Audit trail
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No activity yet.</p>
            ) : (
              <ol className="space-y-3">
                {auditLogs.slice(0, 15).map(log => (
                  <li key={log.id} className="text-xs">
                    <div className="font-medium text-slate-700 dark:text-slate-200">{log.action}</div>
                    <div className="text-slate-500 dark:text-slate-400">
                      <UserIcon size={10} className="inline mr-1" />{log.user} · {new Date(log.timestamp).toLocaleString()}
                    </div>
                    {log.details && <div className="text-slate-500 dark:text-slate-400 mt-0.5 italic">{log.details}</div>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
