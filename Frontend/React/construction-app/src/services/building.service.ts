import api from "./api";
import type {
  BuildingRead,
  BuildingDetail,
  CreateBuilding,
  UpdateBuilding,
} from "../types/building.types";

const BASE = "/api/Buildings";

export const buildingService = {
  getAll: async () => {
    const res = await api.get<BuildingRead[]>(BASE);
    return res.data;
  },

  getById: async (id: number) => {
    const res = await api.get<BuildingDetail>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (data: CreateBuilding) => {
    const res = await api.post<BuildingRead>(BASE, data);
    return res.data;
  },

  update: async (id: number, data: UpdateBuilding) => {
    await api.put(`${BASE}/${id}`, data);
  },

  delete: async (id: number) => {
    await api.delete(`${BASE}/${id}`);
  },
};
