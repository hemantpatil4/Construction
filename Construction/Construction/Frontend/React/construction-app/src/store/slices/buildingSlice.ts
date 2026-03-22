import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { buildingService } from "../../services/building.service";
import type {
  BuildingState,
  BuildingRead,
  BuildingDetail,
  CreateBuilding,
  UpdateBuilding,
} from "../../types/building.types";
import axios from "axios";

const extractError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (msg) return msg;
    if (error.response?.status === 404) return "Building not found";
    if (error.response?.status === 403) return "Access denied — Admin only";
    return error.message;
  }
  return "An unexpected error occurred";
};

const initialState: BuildingState = {
  buildings: [],
  selectedBuilding: null,
  loading: false,
  error: null,
};

// ─── Thunks ───

export const fetchBuildings = createAsyncThunk<
  BuildingRead[],
  void,
  { rejectValue: string }
>("buildings/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await buildingService.getAll();
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const fetchBuildingById = createAsyncThunk<
  BuildingDetail,
  number,
  { rejectValue: string }
>("buildings/fetchById", async (id, { rejectWithValue }) => {
  try {
    return await buildingService.getById(id);
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const createBuilding = createAsyncThunk<
  BuildingRead,
  CreateBuilding,
  { rejectValue: string }
>("buildings/create", async (data, { rejectWithValue }) => {
  try {
    return await buildingService.create(data);
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const updateBuilding = createAsyncThunk<
  void,
  { id: number; data: UpdateBuilding },
  { rejectValue: string }
>("buildings/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    await buildingService.update(id, data);
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const deleteBuilding = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("buildings/delete", async (id, { rejectWithValue }) => {
  try {
    await buildingService.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

// ─── Slice ───

const buildingSlice = createSlice({
  name: "buildings",
  initialState,
  reducers: {
    clearBuildingError(state) {
      state.error = null;
    },
    clearSelectedBuilding(state) {
      state.selectedBuilding = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchBuildings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBuildings.fulfilled, (state, action) => {
        state.loading = false;
        state.buildings = action.payload;
      })
      .addCase(fetchBuildings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch buildings";
      });

    // Fetch By Id
    builder
      .addCase(fetchBuildingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBuildingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBuilding = action.payload;
      })
      .addCase(fetchBuildingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch building";
      });

    // Create
    builder
      .addCase(createBuilding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBuilding.fulfilled, (state, action) => {
        state.loading = false;
        state.buildings.push(action.payload);
      })
      .addCase(createBuilding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create building";
      });

    // Update
    builder
      .addCase(updateBuilding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBuilding.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateBuilding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update building";
      });

    // Delete
    builder
      .addCase(deleteBuilding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBuilding.fulfilled, (state, action) => {
        state.loading = false;
        state.buildings = state.buildings.filter(
          (b) => b.id !== action.payload,
        );
      })
      .addCase(deleteBuilding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete building";
      });
  },
});

export const { clearBuildingError, clearSelectedBuilding } =
  buildingSlice.actions;
export default buildingSlice.reducer;
