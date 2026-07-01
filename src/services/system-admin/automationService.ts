import type { ApiResponse } from "../../common/types";
import type {
  AutomationDashboardDto,
  CreateWorkflowRequest,
  ExecutionDetailDto,
  ExecutionSummaryDto,
  OutboxEventDto,
  Paginated,
  UpdateWorkflowRequest,
  WorkflowDetailDto,
  WorkflowSummaryDto,
  WorkflowVersionDto,
} from "../../modules/system-admin/automationSchema";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

const api = endpoints.sysadmin.automation;

export async function getDashboard(): Promise<AutomationDashboardDto> {
  const res = await request.get<ApiResponse<AutomationDashboardDto>>(api.dashboard);
  return res.data!;
}

export async function listWorkflows(params?: {
  isEnabled?: boolean;
  trigger?: string;
  mode?: string;
}): Promise<WorkflowSummaryDto[]> {
  const res = await request.get<ApiResponse<WorkflowSummaryDto[]>>(api.workflows, { params });
  return res.data ?? [];
}

export async function getWorkflow(id: string): Promise<WorkflowDetailDto> {
  const res = await request.get<ApiResponse<WorkflowDetailDto>>(api.workflow(id));
  return res.data!;
}

export async function createWorkflow(body: CreateWorkflowRequest): Promise<WorkflowDetailDto> {
  const res = await request.post<ApiResponse<WorkflowDetailDto>, CreateWorkflowRequest>(api.workflows, body);
  return res.data!;
}

export async function updateWorkflow(id: string, body: UpdateWorkflowRequest): Promise<WorkflowDetailDto> {
  const res = await request.patch<ApiResponse<WorkflowDetailDto>, UpdateWorkflowRequest>(api.workflow(id), body);
  return res.data!;
}

export async function publishWorkflow(id: string): Promise<WorkflowVersionDto> {
  const res = await request.post<ApiResponse<WorkflowVersionDto>>(api.publish(id));
  return res.data!;
}

export async function setWorkflowEnabled(id: string, isEnabled: boolean): Promise<WorkflowDetailDto> {
  const res = await request.patch<ApiResponse<WorkflowDetailDto>, { isEnabled: boolean }>(
    api.setEnabled(id),
    { isEnabled },
  );
  return res.data!;
}

export async function listExecutions(params?: {
  workflowId?: string;
  status?: string;
  eventType?: string;
  mode?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<ExecutionSummaryDto>> {
  const res = await request.get<ApiResponse<Paginated<ExecutionSummaryDto>>>(api.executions, { params });
  return res.data!;
}

export async function getExecution(id: string): Promise<ExecutionDetailDto> {
  const res = await request.get<ApiResponse<ExecutionDetailDto>>(api.execution(id));
  return res.data!;
}

export async function retryExecution(id: string): Promise<ExecutionDetailDto> {
  const res = await request.post<ApiResponse<ExecutionDetailDto>>(api.retry(id));
  return res.data!;
}

export async function listEvents(params?: {
  status?: string;
  eventType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<OutboxEventDto>> {
  const res = await request.get<ApiResponse<Paginated<OutboxEventDto>>>(api.events, { params });
  return res.data!;
}
