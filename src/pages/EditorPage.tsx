import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getNote } from "@/api/client";
import { ROUTES } from "@/routes/paths";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectAuthToken, selectCurrentUser } from "@/store/authSlice";
import {
  createNoteThunk,
  selectNotes,
  updateNoteThunk,
} from "@/store/notesSlice";

const toolbarActions = [
  { label: "B", command: "bold", title: "Bold" },
  { label: "I", command: "italic", title: "Italic" },
  { label: "U", command: "underline", title: "Underline" },
  { label: "HL", command: "hiliteColor", value: "#8f5bff", title: "Highlight" },
  { label: "List", command: "insertUnorderedList", title: "Bullet List" },
] as const;

interface EditorStatus {
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string;
}

export default function EditorPage() {
  const navigate = useNavigate();
  const { noteId } = useParams<{ noteId: string }>();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAuthToken);
  const notes = useAppSelector(selectNotes);

  const editorRef = useRef<HTMLDivElement>(null);
  const existingNote = noteId ? notes.find((n) => n.id === noteId) : undefined;

  const [title, setTitle] = useState(existingNote?.title ?? "Untitled");
  const [editorStatus, setEditorStatus] = useState<EditorStatus>({
    isLoading: false,
    isSaving: false,
    errorMessage: "",
  });

  // Populate editor content when note changes
  useEffect(() => {
    if (!noteId) {
      setTitle("Untitled");
      if (editorRef.current) editorRef.current.innerHTML = "";
      return;
    }

    if (existingNote) {
      setTitle(existingNote.title);
      if (editorRef.current) editorRef.current.innerHTML = existingNote.content;
      return;
    }

    // Note not in store yet — fetch it directly
    if (!token) return;

    let cancelled = false;

    async function loadNote() {
      if (!token || !noteId) return;
      setEditorStatus({ isLoading: true, isSaving: false, errorMessage: "" });
      try {
        const note = await getNote(token, noteId);
        if (cancelled) return;
        setTitle(note.title);
        if (editorRef.current) editorRef.current.innerHTML = note.content;
        setEditorStatus({
          isLoading: false,
          isSaving: false,
          errorMessage: "",
        });
      } catch (error) {
        if (cancelled) return;
        setEditorStatus({
          isLoading: false,
          isSaving: false,
          errorMessage:
            error instanceof Error ? error.message : "Failed to load note",
        });
      }
    }

    void loadNote();
    return () => {
      cancelled = true;
    };
  }, [existingNote, noteId, token]);

  if (!user || !token) return null;

  function applyCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  async function handleSave() {
    if (!token) return;
    const trimmedTitle = title.trim() || "Untitled";
    const content = editorRef.current?.innerHTML ?? "";
    setEditorStatus({ isLoading: false, isSaving: true, errorMessage: "" });

    try {
      if (noteId) {
        await dispatch(
          updateNoteThunk({
            token,
            id: noteId,
            note: { title: trimmedTitle, content },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createNoteThunk({
            token,
            note: { title: trimmedTitle, content },
          }),
        ).unwrap();
      }
      navigate(ROUTES.dashboard);
    } catch (error) {
      setEditorStatus({
        isLoading: false,
        isSaving: false,
        errorMessage:
          error instanceof Error ? error.message : "Failed to save note",
      });
    }
  }

  return (
    <div className="simple-page editor-page">
      <div className="editor-shell">
        <header className="editor-header">
          <div className="editor-heading">
            <p className="eyebrow">Text editor</p>
            <input
              className="editor-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
            />
          </div>

          <div className="editor-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate(ROUTES.dashboard)}
            >
              Close Editor
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={handleSave}
              disabled={editorStatus.isSaving}
            >
              {editorStatus.isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </header>

        {editorStatus.errorMessage ? (
          <p className="status-message error">{editorStatus.errorMessage}</p>
        ) : null}
        {editorStatus.isLoading ? (
          <p className="status-message">Loading note…</p>
        ) : null}

        <div className="toolbar">
          {toolbarActions.map((action) => (
            <button
              key={action.title}
              type="button"
              className="toolbar-button"
              title={action.title}
              onClick={() =>
                applyCommand(
                  action.command,
                  "value" in action ? action.value : undefined,
                )
              }
            >
              {action.label}
            </button>
          ))}
        </div>

        <div
          ref={editorRef}
          className="editor-surface"
          contentEditable
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
