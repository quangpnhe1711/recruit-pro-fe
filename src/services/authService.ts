import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export const authService = {
  login: async (data) : Promise<any> => {
    return request.post(endpoints.auth.login, data);
  },
  logout: async () => {
    return request.post(endpoints.auth.logout);
  },
};
