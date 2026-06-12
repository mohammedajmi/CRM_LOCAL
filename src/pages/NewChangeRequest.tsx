import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Sparkles, Send, GitMerge,
  FileText, Cpu, CheckCircle, Loader2, RotateCcw,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge, priorityVariant } from '../components/ui/Badge';
import { DEPARTMENTS, PRIORITIES } from '../data/types';
import type { BRD, Department, Priority, WorkflowStep, WorkflowTemplate } from '../data/types';
import { WORKFLOW_TEMPLATES } from '../data/workflowTemplates';
import { generateBRD, suggestWorkflows, isAIEnabled } from '../services/ai';
import { Requests } from '../data/db';
import { getCurrentUser } from '../data/auth';

const STEPS = ['Basic info', 'AI analysis', 'Workflow', 'Review'] as const;

const emptyBRD: BRD = {
  problemStatement: '',
  proposedSolution: '',
  areaOfChange: '',
  regulatoryCompliance: '',
  operationalRisk: '',
  financeReview: '',
  reportsRequired: false,
  auditRequired: false,
  processReengineeringNeeded: false,
  processReengineeringDetails: '',
  affectedDepartments: [],
  requirementsList: [],
};

export const NewChangeRequest: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Basic info
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [department, setDepartment] = useState<Department>((currentUser?.department as Department) || 'IT');

  // BRD
  const [brd, setBrd] = useState<BRD>(emptyBRD);

  // Workflow
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(WORKFLOW_TEMPLATES);
  const [suggestion, setSuggestion] = useState<{ templateId: string; reason: string } | null>(null);
  const [selected, setSelected] = useState<WorkflowTemplate | null>(null);

  const updateBrd = (patch: Partial<BRD>) => setBrd(b => ({ ...b, ...patch }));

  // Step actions
  const goNext = async () => {
    if (step === 0) {
      if (!title.trim() || !problem.trim() || !solution.trim()) {
        alert('Please complete title, problem statement, and proposed solution.');
        return;
      }
      setAiGenerating(true);
      try {
        const generated = await generateBRD(problem, solution);
        setBrd(generated);
        setStep(1);
      } catch (e) {
        console.error(e);
        setBrd({ ...emptyBRD, problemStatement: problem, proposedSolution: solution, requirementsList: [''] });
        setStep(1);
      } finally {
        setAiGenerating(false);
      }
    } else if (step === 1) {
      setLoading(true);
      try {
        const { templates, suggestion } = await suggestWorkflows(brd);
        setTemplates(templates);
        setSuggestion(suggestion);
        setSelected(templates.find(t => t.id === suggestion.templateId) || templates[0]);
        setStep(2);
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!selected) {
        alert('Please select a workflow.');
        return;
      }
      setStep(3);
    }
  };

  const goBack = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = () => {
    if (!currentUser || !selected) return;
    setLoading(true);
    try {
      const steps: WorkflowStep[] = selected.steps.map((s, i) => ({
        ...s,
        status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
      }));
      const cr = Requests.create({
        title,
        initiator: currentUser.name,
        department,
        priority,
        brd: { ...brd, problemStatement: problem, proposedSolution: solution },
        workflow: { templateId: selected.id, templateName: selected.name, steps },
      });
      navigate(`/cr/${cr.id}`, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/change-requests')} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Change Request</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI-assisted BRD creation in 4 steps</p>
        </div>
      </div>

      {/* Stepper */}
      <Card className="p-3 md:p-4">
        <div className="flex items-center justify-between gap-1 md:gap-2 overflow-x-auto">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-brand-600 text-white' :
                'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-xs md:text-sm font-medium truncate ${
                i === step ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Step 0: Basic info */}
      {step === 0 && (
        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
            <FileText size={18} /><h2 className="font-semibold">Basic information</h2>
          </div>
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Implement new e-KYC flow for retail customers" required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Initiating department"
              value={department}
              onChange={e => setDepartment(e.target.value as Department)}
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`h-10 rounded-lg text-xs md:text-sm font-semibold transition-colors border ${
                      priority === p
                        ? p === 'Critical' ? 'bg-red-600 text-white border-red-700' :
                          p === 'High'     ? 'bg-orange-500 text-white border-orange-600' :
                          p === 'Medium'   ? 'bg-amber-500 text-white border-amber-600' :
                                             'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Textarea label="Problem statement" value={problem} onChange={e => setProblem(e.target.value)} placeholder="What problem are we solving? Why now?" rows={4} required />
          <Textarea label="Proposed solution" value={solution} onChange={e => setSolution(e.target.value)} placeholder="How will you solve it? At a high level." rows={4} required />
        </Card>
      )}

      {/* Step 1: AI BRD */}
      {step === 1 && (
        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
              <Sparkles size={18} /><h2 className="font-semibold">AI-generated BRD</h2>
            </div>
            {isAIEnabled() ? (
              <Badge variant="success">AI active</Badge>
            ) : (
              <Badge variant="warning">No API key — fill manually</Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Area of change" value={brd.areaOfChange} onChange={e => updateBrd({ areaOfChange: e.target.value })} />
            <Textarea label="Regulatory compliance (CBO etc.)" value={brd.regulatoryCompliance} onChange={e => updateBrd({ regulatoryCompliance: e.target.value })} rows={3} />
            <Textarea label="Operational risk" value={brd.operationalRisk} onChange={e => updateBrd({ operationalRisk: e.target.value })} rows={3} />
            <Textarea label="Finance review" value={brd.financeReview} onChange={e => updateBrd({ financeReview: e.target.value })} rows={3} />
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={brd.reportsRequired} onChange={e => updateBrd({ reportsRequired: e.target.checked })} className="rounded" />
              Reports required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={brd.auditRequired} onChange={e => updateBrd({ auditRequired: e.target.checked })} className="rounded" />
              Audit required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={brd.processReengineeringNeeded} onChange={e => updateBrd({ processReengineeringNeeded: e.target.checked })} className="rounded" />
              Process re-engineering needed
            </label>
          </div>
          {brd.processReengineeringNeeded && (
            <Textarea label="Process re-engineering details" value={brd.processReengineeringDetails} onChange={e => updateBrd({ processReengineeringDetails: e.target.value })} rows={3} />
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Functional requirements</label>
            <div className="space-y-2">
              {(brd.requirementsList.length === 0 ? [''] : brd.requirementsList).map((req, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-400 text-sm w-6 text-right pt-2.5">{i + 1}.</span>
                  <Input
                    value={req}
                    onChange={e => {
                      const next = [...brd.requirementsList]; next[i] = e.target.value;
                      updateBrd({ requirementsList: next });
                    }}
                    placeholder={`Requirement ${i + 1}`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => updateBrd({ requirementsList: brd.requirementsList.filter((_, j) => j !== i) })}>×</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateBrd({ requirementsList: [...brd.requirementsList, ''] })}>+ Add requirement</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Workflow Selection */}
      {step === 2 && (
        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
            <GitMerge size={18} /><h2 className="font-semibold">Choose a workflow</h2>
          </div>
          {suggestion && (
            <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-sm">
              <div className="flex items-center gap-2 mb-1 font-medium text-brand-700 dark:text-brand-300">
                <Cpu size={14} /> AI recommendation
              </div>
              <p className="text-slate-700 dark:text-slate-300">{suggestion.reason}</p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selected?.id === t.id
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">{t.id}</span>
                  {suggestion?.templateId === t.id && <Badge variant="brand">Recommended</Badge>}
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.description}</p>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {t.steps.length} step{t.steps.length !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
          {selected && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Steps in {selected.name}</h4>
              <ol className="space-y-2">
                {selected.steps.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{s.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{s.department} · {s.type}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && selected && (
        <Card className="p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
            <CheckCircle size={18} /><h2 className="font-semibold">Review & submit</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs uppercase text-slate-400">Title</div><div className="font-medium">{title}</div></div>
            <div><div className="text-xs uppercase text-slate-400">Initiator</div><div className="font-medium">{currentUser?.name}</div></div>
            <div><div className="text-xs uppercase text-slate-400">Department</div><div className="font-medium">{department}</div></div>
            <div><div className="text-xs uppercase text-slate-400">Priority</div><Badge variant={priorityVariant(priority)}>{priority}</Badge></div>
            <div><div className="text-xs uppercase text-slate-400">Workflow</div><div className="font-medium">{selected.name}</div></div>
            <div><div className="text-xs uppercase text-slate-400">Steps</div><div className="font-medium">{selected.steps.length}</div></div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">Problem statement</div>
              <p className="text-slate-700 dark:text-slate-300">{problem}</p>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">Proposed solution</div>
              <p className="text-slate-700 dark:text-slate-300">{solution}</p>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">Regulatory</div>
              <p className="text-slate-700 dark:text-slate-300">{brd.regulatoryCompliance || '—'}</p>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">Operational risk</div>
              <p className="text-slate-700 dark:text-slate-300">{brd.operationalRisk || '—'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Footer controls */}
      <div className="sticky bottom-0 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 z-20">
        <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={goBack} disabled={step === 0 || loading || aiGenerating}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          {step === 1 && (
            <Button variant="outline" size="sm" leftIcon={<RotateCcw size={14} />} onClick={() => setBrd(emptyBRD)} disabled={loading || aiGenerating}>
              Reset BRD
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={goNext} isLoading={loading || aiGenerating} rightIcon={!loading && !aiGenerating && <ArrowRight size={16} />}>
              {aiGenerating ? 'Analyzing...' : step === 0 ? 'Generate BRD' : 'Next'}
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={loading} leftIcon={!loading && <Send size={16} />}>
              Create Change Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
