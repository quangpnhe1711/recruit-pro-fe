import { ApiResponse } from "../../common/types";

import { LoginRequest, LoginResponseDto } from "../../modules/auth/authSchema";

import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponseDto>> => {
    return request.post<ApiResponse<LoginResponseDto>>(
      endpoints.auth.login,
      data,
    );
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>>(endpoints.auth.logout);
  },
};
