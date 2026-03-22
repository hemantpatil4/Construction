import api from "./api";
import type { UserRead, UpdateUserRole } from "../types/auth.types";

const USERS_BASE = "/api/Users";

export const userService = {
  getAll: async () => {
    const response = await api.get<UserRead[]>(USERS_BASE);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<UserRead>(`${USERS_BASE}/${id}`);
    return response.data;
  },

  updateRole: async (id: number, data: UpdateUserRole) => {
    const response = await api.put<UserRead>(`${USERS_BASE}/${id}/role`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`${USERS_BASE}/${id}`);
  },
};
