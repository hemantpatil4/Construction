// ─── Request DTOs ───
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: "Admin" | "User";
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UpdateUserRole {
  role: "Admin" | "User";
}

// ─── Response DTOs ───
export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  expiresAt: string;
}

export interface UserRead {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface CurrentUser {
  userId: string;
  username: string;
  role: string;
}

// ─── Auth State ───
export interface AuthState {
  user: CurrentUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ─── User Management State ───
export interface UserManagementState {
  users: UserRead[];
  loading: boolean;
  error: string | null;
}
