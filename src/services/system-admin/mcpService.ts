import type { ApiResponse } from "../../common/types";
import type {
  McpAuditDto,
  McpToolDto,
  McpToolResult,
  Paginated,
} from "../../modules/system-admin/automationSchema";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

const api = endpoints.sysadmin.mcp;

export async function listTools(): Promise<McpToolDto[]> {
  const res = await request.get<ApiResponse<McpToolDto[]>>(api.tools);
  return res.data ?? [];
}

export async function testTool(name: string, inputJson: string): Promise<McpToolResult> {
  const res = await request.post<ApiResponse<McpToolResult>, { inputJson: string }>(
    api.testTool(name),
    { inputJson },
  );
  return res.data!;
}

export async function listAudits(params?: {
  toolName?: string;
  allowed?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<McpAuditDto>> {
  const res = await request.get<ApiResponse<Paginated<McpAuditDto>>>(api.audits, { params });
  return res.data!;
}
