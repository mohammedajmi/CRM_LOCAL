/**
 * Gemini AI service — direct browser → Gemini calls (no backend).
 *
 * Requires VITE_API_KEY at build time (set in Vercel env vars). When
 * the key is missing, every function falls back to a sensible default
 * so the UI keeps working — the AI features are just disabled.
 */
import { GoogleGenAI, Type } from '@google/genai';
import type { BRD, Department } from '../data/types';
import { WORKFLOW_TEMPLATES } from '../data/workflowTemplates';

const apiKey = import.meta.env.VITE_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const isAIEnabled = (): boolean => !!ai;

// ── BRD Generation ────────────────────────────────────────────────────────────

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

export async function generateBRD(
  problemStatement: string,
  proposedSolution: string,
): Promise<BRD> {
  if (!ai) {
    // No API key — return a minimal scaffold so the user can fill manually
    return {
      ...emptyBRD,
      problemStatement,
      proposedSolution,
      requirementsList: [''],
    };
  }

  const prompt = `
You are a senior banking analyst at Oman Housing Bank (OHB). Generate a Business Requirements Document (BRD) for the following change request.

Problem Statement: ${problemStatement}
Proposed Solution: ${proposedSolution}

Produce a structured BRD covering:
- areaOfChange: which functional area is affected (e.g., "Retail Banking — Loan Servicing")
- regulatoryCompliance: relevant Central Bank of Oman (CBO) circulars, AML/KYC, IFRS9, or other regulations and whether/how the change impacts them
- operationalRisk: risks introduced or mitigated (operational, reputational, fraud, etc.) and severity
- financeReview: budget impact, GL accounts touched, expected cost or saving
- reportsRequired: boolean — true if MIS/regulatory reports need updates
- auditRequired: boolean — true if an external/internal audit must sign off
- processReengineeringNeeded: boolean
- processReengineeringDetails: brief description if process re-engineering applies, else ""
- affectedDepartments: from [IT, Operations, Legal, Compliance, Risk, Finance, HR, CBO, CAB, Admin]
- requirementsList: 3-7 numbered functional requirements as plain strings

Keep all string fields concise (1-3 sentences). Return ONLY the JSON object.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            areaOfChange:                { type: Type.STRING },
            regulatoryCompliance:        { type: Type.STRING },
            operationalRisk:             { type: Type.STRING },
            financeReview:               { type: Type.STRING },
            reportsRequired:             { type: Type.BOOLEAN },
            auditRequired:               { type: Type.BOOLEAN },
            processReengineeringNeeded:  { type: Type.BOOLEAN },
            processReengineeringDetails: { type: Type.STRING },
            affectedDepartments:         { type: Type.ARRAY, items: { type: Type.STRING } },
            requirementsList:            { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });
    const parsed = JSON.parse(response.text || '{}');
    return {
      ...emptyBRD,
      ...parsed,
      problemStatement,
      proposedSolution,
      affectedDepartments: (parsed.affectedDepartments || []) as Department[],
      requirementsList: parsed.requirementsList || [],
    };
  } catch (err) {
    console.error('[AI] BRD generation failed:', err);
    return {
      ...emptyBRD,
      problemStatement,
      proposedSolution,
      requirementsList: [''],
    };
  }
}

// ── Workflow Suggestion ───────────────────────────────────────────────────────

export async function suggestWorkflow(brd: Partial<BRD>): Promise<{ templateId: string; reason: string }> {
  if (!ai) return { templateId: 'WF-STD', reason: 'AI disabled — defaulting to Standard workflow.' };

  const templates = WORKFLOW_TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    steps: t.steps.map(s => ({ id: s.id, name: s.name, department: s.department, type: s.type })),
  }));

  const prompt = `
Analyse this banking change request BRD and recommend the most appropriate workflow.

Regulatory: "${brd.regulatoryCompliance || ''}"
Operational risk: "${brd.operationalRisk || ''}"
Affected departments: ${(brd.affectedDepartments || []).join(', ') || 'none'}

Available workflows:
${JSON.stringify(templates)}

Return JSON: { templateId: string, reason: string (one short sentence) }
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            templateId: { type: Type.STRING },
            reason:     { type: Type.STRING },
          },
        },
      },
    });
    const res = JSON.parse(response.text || '{}');
    const validIds = WORKFLOW_TEMPLATES.map(t => t.id);
    if (validIds.includes(res.templateId)) return res;
    return { templateId: 'WF-STD', reason: res.reason || 'Defaulting to Standard.' };
  } catch (err) {
    console.error('[AI] Workflow suggestion failed:', err);
    return { templateId: 'WF-STD', reason: 'Defaulting to Standard (AI unavailable).' };
  }
}

// Returns all workflow templates, with the AI-suggested one moved to the front.
export async function suggestWorkflows(brd: Partial<BRD>) {
  const suggestion = await suggestWorkflow(brd);
  const sorted = [...WORKFLOW_TEMPLATES].sort((a, b) => (a.id === suggestion.templateId ? -1 : b.id === suggestion.templateId ? 1 : 0));
  return { templates: sorted, suggestion };
}
