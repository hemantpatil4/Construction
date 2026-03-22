import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userService } from "../../services/user.service";
import type {
  UserManagementState,
  UserRead,
  UpdateUserRole,
} from "../../types/auth.types";
import axios from "axios";

const extractError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.title) return data.title;
    if (error.response?.status === 404) return "User not found";
    if (error.response?.status === 403) return "Access denied — Admin only";
    return error.message;
  }
  return "An unexpected error occurred";
};

const initialState: UserManagementState = {
  users: [],
  loading: false,
  error: null,
};

// ─── Thunks ───

export const fetchUsers = createAsyncThunk<
  UserRead[],
  void,
  { rejectValue: string }
>("users/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await userService.getAll();
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const updateUserRole = createAsyncThunk<
  UserRead,
  { id: number; data: UpdateUserRole },
  { rejectValue: string }
>("users/updateRole", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await userService.updateRole(id, data);
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const deleteUser = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("users/delete", async (id, { rejectWithValue }) => {
  try {
    await userService.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

// ─── Slice ───

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? "Failed to fetch users";
    });

    // Update Role
    builder.addCase(updateUserRole.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserRole.fulfilled, (state, action) => {
      state.loading = false;
      const idx = state.users.findIndex((u) => u.id === action.payload.id);
      if (idx !== -1) state.users[idx] = action.payload;
    });
    builder.addCase(updateUserRole.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? "Failed to update user role";
    });

    // Delete
    builder.addCase(deleteUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users = state.users.filter((u) => u.id !== action.payload);
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload ?? "Failed to delete user";
    });
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
