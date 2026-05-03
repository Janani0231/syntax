import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { listFiles, saveFile, toUploadPayload } from "@/api/client";
import type { RootState } from "@/store";
import type { AppFile, LoadStatus } from "@/types";

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchFiles = createAsyncThunk(
  "files/fetchAll",
  async (token: string) => listFiles(token),
);

export const uploadFilesThunk = createAsyncThunk(
  "files/upload",
  async ({ token, rawFiles }: { token: string; rawFiles: File[] }) => {
    const payloads = await Promise.all(rawFiles.map(toUploadPayload));
    const saved = await Promise.all(payloads.map((p) => saveFile(token, p)));
    return saved;
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

interface FilesState {
  files: AppFile[];
  status: LoadStatus;
  error: string;
  isUploading: boolean;
  uploadError: string;
}

const initialState: FilesState = {
  files: [],
  status: "idle",
  error: "",
  isUploading: false,
  uploadError: "",
};

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    clearFiles(state) {
      state.files = [];
      state.status = "idle";
      state.error = "";
      state.isUploading = false;
      state.uploadError = "";
    },
  },
  extraReducers: (builder) => {
    // fetchFiles
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load files";
      });

    // uploadFilesThunk
    builder
      .addCase(uploadFilesThunk.pending, (state) => {
        state.isUploading = true;
        state.uploadError = "";
      })
      .addCase(uploadFilesThunk.fulfilled, (state, action) => {
        state.isUploading = false;
        // merge saved files with existing list (de-dupe by name)
        const savedNames = new Set(action.payload.map((f) => f.name));
        state.files = [
          ...action.payload,
          ...state.files.filter((f) => !savedNames.has(f.name)),
        ];
      })
      .addCase(uploadFilesThunk.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.error.message ?? "Upload failed";
      });
  },
});

export const selectFiles = (state: RootState) => state.files.files;
export const selectFilesStatus = (state: RootState) => state.files.status;
export const selectFilesError = (state: RootState) => state.files.error;
export const selectIsUploadingFiles = (state: RootState) =>
  state.files.isUploading;
export const selectUploadError = (state: RootState) => state.files.uploadError;

export const { clearFiles } = filesSlice.actions;
export default filesSlice.reducer;
