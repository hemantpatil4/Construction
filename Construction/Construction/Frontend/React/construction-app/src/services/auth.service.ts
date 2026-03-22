import api from "./api";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  CurrentUser,
} from "../types/auth.types";

const AUTH_BASE = "/api/Auth";

export const authService = {
  register: async (data: RegisterRequest) => {
    const response = await api.post<CurrentUser>(`${AUTH_BASE}/register`, data);
    return response.data;
  },

  login: async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>(`${AUTH_BASE}/login`, data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get<CurrentUser>(`${AUTH_BASE}/me`);
    return response.data;
  },

  adminOnly: async () => {
    const response = await api.get<{ message: string }>(
      `${AUTH_BASE}/admin-only`,
    );
    return response.data;
  },
};
