// v4 Workflow Automation + MCP DTOs (mirror the backend ApiResponse<T> payloads).

export type WorkflowMode = "Shadow" | "Live" | "Disabled";

export type WorkflowExecutionStatus =
  | "Pending"
  | "Running"
  | "Success"
  | "Skipped"
  | "Failed"
  | "Retrying"
  | "DeadLetter";

export const TRIGGER_EVENT_TYPES = [
  "CandidateApplied",
  "PassedToHeadReview",
  "InterviewCompleted",
  "JobApproved",
  "CandidateScoreReady",
  "HeadReviewOverdue",
] as const;

export const ACTION_TYPES = [
  "notify_user",
  "notify_role",
  "send_reminder",
  "rule_based_next_step_suggestion",
  "shadow_log",
] as const;

export const CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "greater_than",
  "greater_than_or_equal",
  "exists",
  "in_list",
  "older_than_days",
] as const;

export const RECIPIENT_SELECTORS = [
  "assignedRecruiter",
  "assignedDepartmentHead",
  "candidate",
] as const;

export type WorkflowCondition = {
  field: string;
  operator: string;
  value?: string | null;
};

export type WorkflowAction = {
  type: string;
  configJson: string;
  description?: string;
};

export type WorkflowVersionDto = {
  id: string;
  versionNo: number;
  triggerEventType: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  mode: WorkflowMode;
  isActive: boolean;
  publishedAt?: string | null;
  createdAt: string;
};

export type WorkflowSummaryDto = {
  id: string;
  name: string;
  isEnabled: boolean;
  activeVersionNo?: number | null;
  triggerEventType?: string | null;
  mode: WorkflowMode;
  lastRunAt?: string | null;
  lastStatus?: string | null;
};

export type ExecutionSummaryDto = {
  id: string;
  workflowDefinitionId: string;
  workflowName: string;
  eventType: string;
  mode: WorkflowMode;
  status: WorkflowExecutionStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  attemptCount: number;
  errorReason?: string | null;
  retryAvailable: boolean;
  createdAt: string;
};

export type WorkflowDetailDto = {
  id: string;
  name: string;
  description?: string | null;
  isEnabled: boolean;
  activeVersion?: WorkflowVersionDto | null;
  versions: WorkflowVersionDto[];
  recentExecutions: ExecutionSummaryDto[];
  createdAt: string;
  updatedAt?: string | null;
};

export type WorkflowStepDto = {
  id: string;
  stepNo: number;
  stepType: string;
  actionType?: string | null;
  status: string;
  inputJson?: string | null;
  outputJson?: string | null;
  errorReason?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type ExecutionDetailDto = ExecutionSummaryDto & {
  inputPayloadJson: string;
  outputJson?: string | null;
  versionSnapshot?: WorkflowVersionDto | null;
  steps: WorkflowStepDto[];
};

export type OutboxEventDto = {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  dedupKey: string;
  status: string;
  occurredAt: string;
  processedAt?: string | null;
  attemptCount: number;
  errorReason?: string | null;
  payloadJson: string;
};

export type AutomationDashboardDto = {
  totalWorkflows: number;
  enabledWorkflows: number;
  executionsToday: number;
  failedExecutions: number;
  deadLetterCount: number;
  mostCommonFailedAction?: string | null;
  recentExecutions: ExecutionSummaryDto[];
};

// --- Diagnostics (v4 runtime observability) ---

export type WorkerHeartbeatDto = {
  name: string;
  lastBeatAt?: string | null;
  secondsSinceBeat?: number | null;
  isStale: boolean;
  status?: string | null;
  detail?: string | null;
};

export type DiagEventRef = {
  eventType: string;
  status: string;
  occurredAt: string;
};

export type DiagExecutionRef = {
  workflowName: string;
  status: string;
  createdAt: string;
};

export type AutomationDiagnosticsDto = {
  automationEnabled: boolean;
  defaultMode: string;
  workers: WorkerHeartbeatDto[];
  dispatcherHealthy: boolean;
  pendingEvents: number;
  processingEvents: number;
  failedEvents: number;
  deadLetterEvents: number;
  executionsToday: number;
  failedExecutions: number;
  unresolvedDeadLetters: number;
  latestEvent?: DiagEventRef | null;
  latestExecution?: DiagExecutionRef | null;
  warnings: string[];
};

export type WorkflowDiagnosticsDto = {
  id: string;
  name: string;
  isEnabled: boolean;
  hasActiveVersion: boolean;
  versionMode?: WorkflowMode | string | null;
  effectiveMode: WorkflowMode;
  triggerEventType?: string | null;
  eventsTodayOfType: number;
  pendingEventsOfType: number;
  executionsToday: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  latestMatchingEvent?: DiagEventRef | null;
  latestExecution?: DiagExecutionRef | null;
  noExecutionReason?: string | null;
  healthy: boolean;
};

export type McpToolDto = {
  name: string;
  description: string;
  permissionsRequired: string[];
  access: string;
  enabled: boolean;
  lastCalledAt?: string | null;
};

export type McpToolResult = {
  allowed: boolean;
  deniedReason?: string | null;
  output?: unknown;
};

export type McpAuditDto = {
  id: string;
  toolName: string;
  callerUserId?: string | null;
  allowed: boolean;
  deniedReason?: string | null;
  latencyMs?: number | null;
  createdAt: string;
  inputJson: string;
  outputSummaryJson?: string | null;
};

export type Paginated<T> = {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type WorkflowConditionInput = { field: string; operator: string; value?: string | null };
export type WorkflowActionInput = { type: string; configJson: string };

export type CreateWorkflowRequest = {
  name: string;
  description?: string;
  triggerEventType: string;
  mode: WorkflowMode;
  conditions: WorkflowConditionInput[];
  actions: WorkflowActionInput[];
};

export type UpdateWorkflowRequest = Partial<CreateWorkflowRequest>;
