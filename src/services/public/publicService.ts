import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export type HomeResponseDto = {
  hero: {
    title: string;
    subtitle: string;
    backgroundImageUrl: string;
  };
  stats: {
    internalHires: number;
    departments: number;
    avgEmployeeRating: number;
  };
  featuredJobs: Array<{
    id: string;
    title: string;
    department: string;
    location: string;
    workMode: string;
    employmentType: string;
    tag: string;
  }>;
};

export const publicService = {
  getHome: async (): Promise<ApiResponse<HomeResponseDto>> => {
    return request.get<ApiResponse<HomeResponseDto>>(endpoints.public.home);
  },
};
