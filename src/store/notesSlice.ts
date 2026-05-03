import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createNote, deleteNote, listNotes, updateNote } from "@/api/client";
import type { RootState } from "@/store";
import type {
  CreateNoteInput,
  LoadStatus,
  Note,
  UpdateNoteInput,
} from "@/types";

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchNotes = createAsyncThunk(
  "notes/fetchAll",
  async (token: string) => listNotes(token),
);

export const createNoteThunk = createAsyncThunk(
  "notes/create",
  async ({ token, note }: { token: string; note: CreateNoteInput }) =>
    createNote(token, note),
);

export const updateNoteThunk = createAsyncThunk(
  "notes/update",
  async ({
    token,
    id,
    note,
  }: {
    token: string;
    id: string;
    note: UpdateNoteInput;
  }) => updateNote(token, id, note),
);

export const deleteNoteThunk = createAsyncThunk(
  "notes/delete",
  async ({ token, id }: { token: string; id: string }) => {
    await deleteNote(token, id);
    return id;
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortByUpdated(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function upsert(notes: Note[], note: Note): Note[] {
  const idx = notes.findIndex((n) => n.id === note.id);
  const next =
    idx === -1 ? [note, ...notes] : notes.map((n, i) => (i === idx ? note : n));
  return sortByUpdated(next);
}

// ─── Slice ────────────────────────────────────────────────────────────────────

interface NotesState {
  notes: Note[];
  status: LoadStatus;
  error: string;
}

const initialState: NotesState = {
  notes: [],
  status: "idle",
  error: "",
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    clearNotes(state) {
      state.notes = [];
      state.status = "idle";
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    // fetchNotes
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notes = sortByUpdated(action.payload);
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load notes";
      });

    // createNoteThunk
    builder
      .addCase(createNoteThunk.fulfilled, (state, action) => {
        state.notes = upsert(state.notes, action.payload);
      })
      .addCase(createNoteThunk.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to create note";
      });

    // updateNoteThunk
    builder
      .addCase(updateNoteThunk.fulfilled, (state, action) => {
        state.notes = upsert(state.notes, action.payload);
      })
      .addCase(updateNoteThunk.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to update note";
      });

    // deleteNoteThunk
    builder
      .addCase(deleteNoteThunk.fulfilled, (state, action) => {
        state.notes = state.notes.filter((n) => n.id !== action.payload);
      })
      .addCase(deleteNoteThunk.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to delete note";
      });
  },
});

export const selectNotes = (state: RootState) => state.notes.notes;
export const selectNotesStatus = (state: RootState) => state.notes.status;
export const selectNotesError = (state: RootState) => state.notes.error;

export const { clearNotes } = notesSlice.actions;
export default notesSlice.reducer;
