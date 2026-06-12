export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ChangeStatus =
  | 'Draft'
  | 'Under Review'
  | 'Compliance Check'
  | 'Approved'
  | 'Implementation'
  | 'Completed'
  | 'Rejected';

export type Department =
  | 'IT'
  | 'Operations'
  | 'Legal'
  | 'Compliance'
  | 'Risk'
  | 'Finance'
  | 'HR'
  | 'CBO'
  | 'CAB'
  | 'Admin';

export type StepType = 'APPROVAL' | 'TASK' | 'NOTIFICATION';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'SKIPPED';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Staff' | 'CAB';
  department: Department;
  avatar?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: StepType;
  department: Department;
  status: StepStatus;
  completedBy?: string;
  completedAt?: string;
  comments?: string;
  isOptional?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: Omit<WorkflowStep, 'status' | 'completedBy' | 'completedAt' | 'comments'>[];
}

export interface BRD {
  problemStatement: string;
  proposedSolution: string;
  areaOfChange: string;
  regulatoryCompliance: string;
  operationalRisk: string;
  financeReview: string;
  reportsRequired: boolean;
  auditRequired: boolean;
  processReengineeringNeeded: boolean;
  processReengineeringDetails: string;
  affectedDepartments: Department[];
  requirementsList: string[];
}

export interface Comment {
  user: string;
  text: string;
  date: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  initiator: string;
  department: Department;
  status: ChangeStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  brd: BRD;
  workflow: {
    templateId: string;
    templateName: string;
    currentStepIndex: number;
    steps: WorkflowStep[];
  };
  comments: Comment[];
}

export interface AuditLog {
  id: string;
  changeId: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export const DEPARTMENTS: Department[] = [
  'IT', 'Operations', 'Legal', 'Compliance', 'Risk',
  'Finance', 'HR', 'CBO', 'CAB', 'Admin',
];

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
