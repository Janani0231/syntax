import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { getCurrentUser, loginUser, registerUser } from "@/api/client";
import type { RootState } from "@/store";
import type {
  AuthCredentials,
  AuthSession,
  LoadStatus,
  RegisterCredentials,
  User,
} from "@/types";

const SESSION_KEY = "syntax-auth-session";

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed.user && parsed.token ? parsed : null;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;

  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

const storedSession = readStoredSession();

interface AuthState {
  user: User | null;
  token: string | null;
  status: LoadStatus;
  error: string;
}

const initialState: AuthState = {
  user: storedSession?.user ?? null,
  token: storedSession?.token ?? null,
  status: "idle",
  error: "",
};

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (credentials: RegisterCredentials) => registerUser(credentials),
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: AuthCredentials) => loginUser(credentials),
);

export const refreshCurrentUserThunk = createAsyncThunk(
  "auth/refreshCurrentUser",
  async (token: string) => {
    const user = await getCurrentUser(token);
    return { user, token } satisfies AuthSession;
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AuthSession>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.status = "succeeded";
      state.error = "";
      persistSession(action.payload);
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = "";
      persistSession(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = "succeeded";
        state.error = "";
        persistSession(action.payload);
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Registration failed";
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = "succeeded";
        state.error = "";
        persistSession(action.payload);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(refreshCurrentUserThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = "succeeded";
        state.error = "";
        persistSession(action.payload);
      })
      .addCase(refreshCurrentUserThunk.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.status = "failed";
        state.error = "Session expired. Please log in again.";
        persistSession(null);
      });
  },
});

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.user && state.auth.token);

export const { setSession, clearUser } = authSlice.actions;
export default authSlice.reducer;
