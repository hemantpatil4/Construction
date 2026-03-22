import api from "./api";
import type { FlatRead, CreateFlat, UpdateFlat } from "../types/building.types";

const BASE = "/api/Flats";

export const flatService = {
  getAll: async () => {
    const res = await api.get<FlatRead[]>(BASE);
    return res.data;
  },

  getById: async (id: number) => {
    const res = await api.get<FlatRead>(`${BASE}/${id}`);
    return res.data;
  },

  getByBuildingId: async (buildingId: number) => {
    const res = await api.get<FlatRead[]>(`${BASE}/building/${buildingId}`);
    return res.data;
  },

  create: async (data: CreateFlat) => {
    const res = await api.post<FlatRead>(BASE, data);
    return res.data;
  },

  update: async (id: number, data: UpdateFlat) => {
    await api.put(`${BASE}/${id}`, data);
  },

  delete: async (id: number) => {
    await api.delete(`${BASE}/${id}`);
  },
};
