import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  settingsService,
  type SettingRead,
} from "../../services/settings.service";

export interface AppSettingsState {
  appName: string;
  loading: boolean;
  error: string | null;
}

const DEFAULT_APP_NAME = "ConstructPro";

// ─── Async Thunks ───

/** Fetch all settings from the server on app load */
export const fetchSettings = createAsyncThunk<
  SettingRead[],
  void,
  { rejectValue: string }
>("appSettings/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await settingsService.getAll();
  } catch (err: unknown) {
    // If server is unreachable, fall back silently
    return rejectWithValue("Failed to load settings");
  }
});

/** Admin updates a setting */
export const updateSetting = createAsyncThunk<
  SettingRead,
  { key: string; value: string },
  { rejectValue: string }
>("appSettings/update", async ({ key, value }, { rejectWithValue }) => {
  try {
    return await settingsService.update(key, value);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update setting";
    return rejectWithValue(msg);
  }
});

// Use localStorage as fast cache so the name shows instantly before API responds
const cachedName = localStorage.getItem("appName");

const initialState: AppSettingsState = {
  appName: cachedName || DEFAULT_APP_NAME,
  loading: false,
  error: null,
};

const appSettingsSlice = createSlice({
  name: "appSettings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ─── Fetch Settings ───
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        for (const setting of action.payload) {
          if (setting.key === "AppName") {
            state.appName = setting.value;
            localStorage.setItem("appName", setting.value);
          }
          // Future settings can be handled here
        }
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });

    // ─── Update Setting ───
    builder
      .addCase(updateSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.key === "AppName") {
          state.appName = action.payload.value;
          localStorage.setItem("appName", action.payload.value);
          document.title = `${action.payload.value} — Building Management`;
        }
      })
      .addCase(updateSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export default appSettingsSlice.reducer;
