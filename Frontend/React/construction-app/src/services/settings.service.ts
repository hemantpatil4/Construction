import api from "./api";

export interface SettingRead {
  key: string;
  value: string;
  updatedAt: string;
}

const SETTINGS_BASE = "/api/Settings";

export const settingsService = {
  getAll: async () => {
    const response = await api.get<SettingRead[]>(SETTINGS_BASE);
    return response.data;
  },

  getByKey: async (key: string) => {
    const response = await api.get<SettingRead>(`${SETTINGS_BASE}/${key}`);
    return response.data;
  },

  update: async (key: string, value: string) => {
    const response = await api.put<SettingRead>(`${SETTINGS_BASE}/${key}`, {
      value,
    });
    return response.data;
  },
};
