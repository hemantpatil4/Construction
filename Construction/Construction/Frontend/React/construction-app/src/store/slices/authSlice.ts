import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { authService } from "../../services/auth.service";
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  CurrentUser,
  AuthResponse,
} from "../../types/auth.types";
import type { ApiErrorResponse } from "../../types/api.types";
import axios from "axios";

// ─── Helper: extract error message ───
const extractError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
    if (error.response?.status === 401) return "Invalid credentials";
    if (error.response?.status === 409) return "User already exists";
    return error.message;
  }
  return "An unexpected error occurred";
};

// ─── Hydrate from localStorage ───
const storedToken = localStorage.getItem("token");
const storedUser = localStorage.getItem("user");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

// ─── Async Thunks ───

export const registerUser = createAsyncThunk<
  CurrentUser,
  RegisterRequest,
  { rejectValue: string }
>("auth/register", async (data, { rejectWithValue }) => {
  try {
    const result = await authService.register(data);
    return result;
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (data, { rejectWithValue }) => {
  try {
    const result = await authService.login(data);
    // Persist token & user
    localStorage.setItem("token", result.token);
    localStorage.setItem(
      "user",
      JSON.stringify({
        userId: "", // Will be fetched via /me
        username: result.username,
        role: result.role,
      }),
    );
    return result;
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

export const fetchCurrentUser = createAsyncThunk<
  CurrentUser,
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const result = await authService.getCurrentUser();
    localStorage.setItem("user", JSON.stringify(result));
    return result;
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

// ─── Slice ───

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError(state) {
      state.error = null;
    },
    setCredentials(
      state,
      action: PayloadAction<{ user: CurrentUser; token: string }>,
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // ─── Register ───
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Registration failed";
      });

    // ─── Login ───
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = {
          userId: "",
          username: action.payload.username,
          role: action.payload.role,
        };
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed";
      });

    // ─── Fetch Current User ───
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch user";
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
