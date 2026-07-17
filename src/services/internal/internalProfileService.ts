import { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export type InternalProfileRoleDto = {
  id: string;
  name: string;
};

export type InternalProfileDto = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  createdAt: string | null;
  roles: InternalProfileRoleDto[];
};

export type UpdateInternalProfileRequest = {
  fullName: string;
  phone: string | null;
};

export const internalProfileService = {
  getProfile: async (): Promise<ApiResponse<InternalProfileDto>> =>
    request.get<ApiResponse<InternalProfileDto>>(endpoints.internal.profile),

  updateProfile: async (
    data: UpdateInternalProfileRequest,
  ): Promise<ApiResponse<InternalProfileDto>> =>
    request.put<ApiResponse<InternalProfileDto>, UpdateInternalProfileRequest>(
      endpoints.internal.profile,
      data,
    ),
};
