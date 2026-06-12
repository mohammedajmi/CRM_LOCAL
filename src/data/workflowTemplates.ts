import type { WorkflowTemplate } from './types';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'WF-STD',
    name: 'Standard Change Workflow',
    description: 'For low-to-medium risk changes with minimal regulatory impact.',
    steps: [
      { id: 's1', name: 'Department Head Approval', description: 'Initial approval from initiating department.', type: 'APPROVAL', department: 'IT' },
      { id: 's2', name: 'Technical Review', description: 'IT validation of technical feasibility.', type: 'TASK', department: 'IT' },
      { id: 's3', name: 'Finance Impact Assessment', description: 'Budget, GL, and cost impact review.', type: 'APPROVAL', department: 'Finance' },
      { id: 's4', name: 'Compliance Review', description: 'Standard compliance check.', type: 'APPROVAL', department: 'Compliance' },
      { id: 's5', name: 'Implementation', description: 'Execute the change.', type: 'TASK', department: 'IT' },
      { id: 's6', name: 'Post-Implementation Review', description: 'Verify success.', type: 'TASK', department: 'Operations' },
    ],
  },
  {
    id: 'WF-REG',
    name: 'Major Regulatory Change (CBO)',
    description: 'High scrutiny workflow for changes impacting Central Bank regulations.',
    steps: [
      { id: 'r1', name: 'Risk Assessment', description: 'Detailed operational risk assessment.', type: 'TASK', department: 'Risk' },
      { id: 'r2', name: 'Legal Review', description: 'Review against CBO circulars.', type: 'APPROVAL', department: 'Legal' },
      { id: 'r3', name: 'Finance Impact & Funding', description: 'Budget approval, GL mapping, and treasury coordination.', type: 'APPROVAL', department: 'Finance' },
      { id: 'r4', name: 'Compliance Sign-off', description: 'Final compliance approval.', type: 'APPROVAL', department: 'Compliance' },
      { id: 'r5', name: 'CAB Approval', description: 'Change Advisory Board review.', type: 'APPROVAL', department: 'CAB' },
      { id: 'r6', name: 'CBO Notification', description: 'Prepare and send notification to Central Bank.', type: 'TASK', department: 'CBO' },
      { id: 'r7', name: 'Implementation', description: 'Execute the change.', type: 'TASK', department: 'IT' },
      { id: 'r8', name: 'External Audit', description: 'Third-party verification of compliance.', type: 'TASK', department: 'Risk' },
    ],
  },
  {
    id: 'WF-EMG',
    name: 'Emergency Fix',
    description: 'Expedited process for critical incidents.',
    steps: [
      { id: 'e1', name: 'Emergency CAB Approval', description: 'Immediate approval by ECAB.', type: 'APPROVAL', department: 'CAB' },
      { id: 'e2', name: 'Implementation', description: 'Execute the fix immediately.', type: 'TASK', department: 'IT' },
      { id: 'e3', name: 'Retroactive Documentation', description: 'Complete documentation and BRD.', type: 'TASK', department: 'Compliance' },
    ],
  },
];

export const getTemplate = (id: string) => WORKFLOW_TEMPLATES.find(t => t.id === id);
