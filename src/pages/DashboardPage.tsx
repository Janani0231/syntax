import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  clearUser,
  selectAuthToken,
  selectCurrentUser,
} from "@/store/authSlice";
import {
  clearNotes,
  deleteNoteThunk,
  fetchNotes,
  selectNotes,
  selectNotesError,
  selectNotesStatus,
} from "@/store/notesSlice";
import {
  clearFiles,
  fetchFiles,
  selectFiles,
  selectFilesError,
  selectFilesStatus,
  selectIsUploadingFiles,
  selectUploadError,
  uploadFilesThunk,
} from "@/store/filesSlice";
import { getFile, logoutUser } from "@/api/client";
import LiveChat from "@/components/LiveChat";
import { editorRoute, ROUTES } from "@/routes/paths";
import type { Note } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadTextFile(
  name: string,
  content: string,
  mimeType = "text/plain;charset=utf-8",
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAuthToken);
  const notes = useAppSelector(selectNotes);
  const notesStatus = useAppSelector(selectNotesStatus);
  const notesError = useAppSelector(selectNotesError);
  const files = useAppSelector(selectFiles);
  const filesStatus = useAppSelector(selectFilesStatus);
  const filesError = useAppSelector(selectFilesError);
  const isUploading = useAppSelector(selectIsUploadingFiles);
  const uploadError = useAppSelector(selectUploadError);

  const [downloadError, setDownloadError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isLoading = notesStatus === "loading" || filesStatus === "loading";
  const workspaceError = notesError || filesError;

  // Load workspace data when the user first lands
  useEffect(() => {
    if (!token) return;
    void dispatch(fetchNotes(token));
    void dispatch(fetchFiles(token));
  }, [dispatch, token]);

  if (!user || !token) return null;

  async function handleLogout() {
    try {
      await logoutUser(token);
    } finally {
      dispatch(clearUser());
      dispatch(clearNotes());
      dispatch(clearFiles());
      navigate(ROUTES.home);
    }
  }

  function handleRefresh() {
    if (!token) return;
    void dispatch(fetchNotes(token));
    void dispatch(fetchFiles(token));
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const rawFiles = Array.from(event.target.files ?? []);
    if (!rawFiles.length || !token) return;
    await dispatch(uploadFilesThunk({ token, rawFiles }));
    event.target.value = "";
  }

  async function handleDownloadFile(fileName: string) {
    if (!token) return;
    setDownloadError("");
    try {
      const fullFile = await getFile(token, fileName);
      if (fullFile.content.startsWith("data:")) {
        const anchor = document.createElement("a");
        anchor.href = fullFile.content;
        anchor.download = fullFile.name;
        anchor.click();
        return;
      }
      downloadTextFile(fullFile.name, fullFile.content);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Download failed",
      );
    }
  }

  function handleDownloadNote(note: Note) {
    downloadTextFile(
      `${note.title || "Untitled"}.html`,
      note.content,
      "text/html;charset=utf-8",
    );
  }

  async function handleDeleteNote(id: string) {
    if (!token) return;
    setDeletingId(id);
    try {
      await dispatch(deleteNoteThunk({ token, id })).unwrap();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="simple-page dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-greeting">hi {user.name}</div>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <section className="table-card">
          <div className="table-actions">
            <button
              type="button"
              className="button button-secondary button-icon"
              onClick={() => navigate(editorRoute())}
            >
              <span>+</span>
              Create Note
            </button>

            <div className="table-actions-right">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleRefresh}
              >
                Refresh
              </button>

              <div>
                <input
                  ref={fileInputRef}
                  className="hidden-input"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </div>

          {workspaceError ? (
            <p className="status-message error">{workspaceError}</p>
          ) : null}
          {uploadError ? (
            <p className="status-message error">{uploadError}</p>
          ) : null}
          {downloadError ? (
            <p className="status-message error">{downloadError}</p>
          ) : null}
          {isLoading ? (
            <p className="status-message">Loading workspace…</p>
          ) : null}

          <div className="dashboard-grid">
            {/* ── Notes Panel ───────────────────────────────────────── */}
            <div className="dashboard-panel">
              <div className="panel-heading">
                <h2>Saved Notes</h2>
                <p>Editor content stored in MongoDB.</p>
              </div>

              {notes.length ? (
                <div className="table-wrap">
                  <table className="file-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Updated</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map((note) => (
                        <tr key={note.id}>
                          <td>{note.title}</td>
                          <td>{formatDate(note.updatedAt)}</td>
                          <td>{formatDate(note.createdAt)}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="download-button"
                                onClick={() => navigate(editorRoute(note.id))}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="download-button"
                                onClick={() => handleDownloadNote(note)}
                              >
                                DL
                              </button>
                              <button
                                type="button"
                                className="download-button delete-button"
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={deletingId === note.id}
                                aria-label={`Delete ${note.title}`}
                              >
                                {deletingId === note.id ? "…" : "Del"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-message">
                  No saved notes yet. Create one in the editor.
                </p>
              )}
            </div>

            {/* ── Files Panel ───────────────────────────────────────── */}
            <div className="dashboard-panel">
              <div className="panel-heading">
                <h2>Uploaded Files</h2>
                <p>Assets and generated files stored on the backend.</p>
              </div>

              {files.length ? (
                <div className="table-wrap">
                  <table className="file-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Date Modified</th>
                        <th>File Size</th>
                        <th>Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.name}>
                          <td>{file.name}</td>
                          <td>{formatDate(file.modifiedAt)}</td>
                          <td>{formatFileSize(file.size)}</td>
                          <td>
                            <button
                              type="button"
                              className="download-button"
                              onClick={() => handleDownloadFile(file.name)}
                              aria-label={`Download ${file.name}`}
                            >
                              DL
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-message">
                  No files yet. Upload one to store it on the server.
                </p>
              )}
            </div>
          </div>
        </section>

        <LiveChat currentUser={user} token={token} />
      </div>
    </div>
  );
}
