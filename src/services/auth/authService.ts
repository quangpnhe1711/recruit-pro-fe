import { ApiResponse } from "../../common/types";

import {
  CandidateLoginRequest,
  LoginRequest,
  LoginResponseDto,
} from "../../modules/auth/authSchema";

import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export type InternalLoginRequest = {
  username: string;
  password: string;
};

export type ForgotPasswordRequest = {
  identifier: string;
};

export const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponseDto>> => {
    return request.post<ApiResponse<LoginResponseDto>>(
      endpoints.auth.login,
      data,
    );
  },

  candidateLogin: async (
    data: CandidateLoginRequest,
  ): Promise<ApiResponse<LoginResponseDto>> => {
    return request.post<ApiResponse<LoginResponseDto>, CandidateLoginRequest>(
      endpoints.auth.candidateLogin,
      data,
    );
  },

  internalLogin: async (
    data: InternalLoginRequest,
  ): Promise<ApiResponse<LoginResponseDto>> => {
    return request.post<ApiResponse<LoginResponseDto>, InternalLoginRequest>(
      endpoints.auth.internalLogin,
      data,
    );
  },

  candidateForgotPassword: async (
    data: ForgotPasswordRequest,
  ): Promise<ApiResponse<string>> => {
    return request.post<ApiResponse<string>, ForgotPasswordRequest>(
      endpoints.auth.candidateForgotPassword,
      data,
    );
  },

  internalForgotPassword: async (
    data: ForgotPasswordRequest,
  ): Promise<ApiResponse<string>> => {
    return request.post<ApiResponse<string>, ForgotPasswordRequest>(
      endpoints.auth.internalForgotPassword,
      data,
    );
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return Promise.resolve({
      success: true,
      message: "Đã đăng xuất trên thiết bị",
      data: null,
    });
  },
};
