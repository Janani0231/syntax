import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import authReducer from "./authSlice";
import notesReducer from "./notesSlice";
import filesReducer from "./filesSlice";

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
    files: filesReducer,
  },
});

// ─── Typed Hooks ──────────────────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
