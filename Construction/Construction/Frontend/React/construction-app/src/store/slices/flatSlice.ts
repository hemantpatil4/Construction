import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { flatService } from "../../services/flat.service";
import type {
  FlatState,
  FlatRead,
  CreateFlat,
  UpdateFlat,
} from "../../types/building.types";
import axios from "axios";

const extractError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (msg) return msg;
    if (error.response?.status === 404) return "Flat not found";
    if (error.response?.status === 403) return "Access denied — Admin only";
    return error.message;
  }
  return "An unexpected error occurred";
};

const initialState: FlatState = {
  flats: [],
  loading: false,
  error: null,
};

// ─── Thunks ───

export const fetchFlats = createAsyncThunk<
  FlatRead[],
  void,
  { rejectValue: string }
>("flats/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await flatService.getAll();
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const fetchFlatsByBuilding = createAsyncThunk<
  FlatRead[],
  number,
  { rejectValue: string }
>("flats/fetchByBuilding", async (buildingId, { rejectWithValue }) => {
  try {
    return await flatService.getByBuildingId(buildingId);
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const createFlat = createAsyncThunk<
  FlatRead,
  CreateFlat,
  { rejectValue: string }
>("flats/create", async (data, { rejectWithValue }) => {
  try {
    return await flatService.create(data);
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const updateFlat = createAsyncThunk<
  void,
  { id: number; data: UpdateFlat },
  { rejectValue: string }
>("flats/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    await flatService.update(id, data);
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const deleteFlat = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("flats/delete", async (id, { rejectWithValue }) => {
  try {
    await flatService.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

// ─── Slice ───

const flatSlice = createSlice({
  name: "flats",
  initialState,
  reducers: {
    clearFlatError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder
      .addCase(fetchFlats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlats.fulfilled, (state, action) => {
        state.loading = false;
        state.flats = action.payload;
      })
      .addCase(fetchFlats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch flats";
      });

    // Fetch By Building
    builder
      .addCase(fetchFlatsByBuilding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlatsByBuilding.fulfilled, (state, action) => {
        state.loading = false;
        state.flats = action.payload;
      })
      .addCase(fetchFlatsByBuilding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch flats";
      });

    // Create
    builder
      .addCase(createFlat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFlat.fulfilled, (state, action) => {
        state.loading = false;
        state.flats.push(action.payload);
      })
      .addCase(createFlat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create flat";
      });

    // Update
    builder
      .addCase(updateFlat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFlat.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateFlat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update flat";
      });

    // Delete
    builder
      .addCase(deleteFlat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFlat.fulfilled, (state, action) => {
        state.loading = false;
        state.flats = state.flats.filter((f) => f.id !== action.payload);
      })
      .addCase(deleteFlat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete flat";
      });
  },
});

export const { clearFlatError } = flatSlice.actions;
export default flatSlice.reducer;
