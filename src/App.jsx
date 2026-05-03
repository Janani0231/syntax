import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";

const SESSION_KEY = "syntax-user";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

const featureCards = [
  {
    title: "Real-Time Synchronization",
    text: "Keep data, teams, and workflows in sync the moment anything changes.",
  },
  {
    title: "End-to-End Type Safety",
    text: "Protect frontend and backend contracts with predictable full-stack types.",
  },
  {
    title: "Cloud-Ready Infrastructure",
    text: "Deploy with confidence using architecture designed for scale and resilience.",
  },
  {
    title: "Intelligent Search & Filtering",
    text: "Surface what matters fast with precise search and context-aware filtering.",
  },
  {
    title: "Responsive & Fluid Design",
    text: "Deliver a fast, polished experience across mobile, tablet, and desktop.",
  },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "$19",
    audience: "For solo builders",
    perks: ["1 project workspace", "Core synchronization", "Email support"],
  },
  {
    name: "Pro",
    price: "$49",
    audience: "For product teams",
    perks: ["Unlimited projects", "Advanced search", "Priority support"],
    featured: true,
  },
  {
    name: "Scale",
    price: "$99",
    audience: "For larger operations",
    perks: ["Cloud-ready deployment", "Custom roles", "Dedicated success support"],
  },
];

const toolbarActions = [
  { label: "B", command: "bold", title: "Bold" },
  { label: "I", command: "italic", title: "Italic" },
  { label: "U", command: "underline", title: "Underline" },
  { label: "HL", command: "hiliteColor", value: "#8f5bff", title: "Highlight" },
  { label: "List", command: "insertUnorderedList", title: "Bullet List" },
];

function readStoredJson(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function apiRequest(path, options = {}) {
  const { userEmail, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path}`;

  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(userEmail ? { "x-user-email": userEmail.trim().toLowerCase() } : {}),
        ...(fetchOptions.headers ?? {}),
      },
    });
  } catch (error) {
    throw new Error(
      `Network error connecting to ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }

  return payload;
}

async function listFiles(userEmail) {
  const payload = await apiRequest("/api/files", { userEmail });
  return payload.files;
}

async function getFile(userEmail, name) {
  const payload = await apiRequest(`/api/files/${encodeURIComponent(name)}`, { userEmail });
  return payload.file;
}

async function createFile(userEmail, file) {
  const payload = await apiRequest("/api/files", {
    userEmail,
    method: "POST",
    body: JSON.stringify(file),
  });

  return payload.file;
}

async function updateFile(userEmail, name, content) {
  const payload = await apiRequest(`/api/files/${encodeURIComponent(name)}`, {
    userEmail,
    method: "PUT",
    body: JSON.stringify({ content }),
  });

  return payload.file;
}

async function saveFile(userEmail, file) {
  try {
    return await createFile(userEmail, file);
  } catch (error) {
    if (error instanceof Error && error.message === "File already exists") {
      return updateFile(userEmail, file.name, file.content);
    }

    throw error;
  }
}

async function listNotes(userEmail) {
  const payload = await apiRequest("/api/notes", { userEmail });
  return payload.notes;
}

async function getNote(userEmail, id) {
  const payload = await apiRequest(`/api/notes/${encodeURIComponent(id)}`, { userEmail });
  return payload.note;
}

async function createNote(userEmail, note) {
  const payload = await apiRequest("/api/notes", {
    userEmail,
    method: "POST",
    body: JSON.stringify(note),
  });

  return payload.note;
}

async function updateNote(userEmail, id, note) {
  const payload = await apiRequest(`/api/notes/${encodeURIComponent(id)}`, {
    userEmail,
    method: "PUT",
    body: JSON.stringify(note),
  });

  return payload.note;
}

function downloadTextFile(name, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sortNotes(notes) {
  return [...notes].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function upsertNote(notes, note) {
  const existingIndex = notes.findIndex((item) => item.id === note.id);

  if (existingIndex === -1) {
    return sortNotes([note, ...notes]);
  }

  const nextNotes = [...notes];
  nextNotes[existingIndex] = note;
  return sortNotes(nextNotes);
}

function App() {
  const [user, setUser] = useState(() => readStoredJson(SESSION_KEY, null));
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [workspaceStatus, setWorkspaceStatus] = useState({
    isLoading: false,
    errorMessage: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (user) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFiles([]);
      setNotes([]);
      setWorkspaceStatus({ isLoading: false, errorMessage: "" });
      return;
    }

    void loadWorkspaceData();
  }, [user]);

  async function loadWorkspaceData() {
    const userEmail = user?.email?.trim().toLowerCase();
    if (!userEmail) {
      return;
    }

    setWorkspaceStatus({ isLoading: true, errorMessage: "" });

    try {
      const [nextFiles, nextNotes] = await Promise.all([
        listFiles(userEmail),
        listNotes(userEmail),
      ]);
      setFiles(nextFiles);
      setNotes(nextNotes);
      setWorkspaceStatus({ isLoading: false, errorMessage: "" });
    } catch (error) {
      setWorkspaceStatus({
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : "Failed to load dashboard data",
      });
    }
  }

  function handleLogout() {
    setUser(null);
  }

  function handleNoteSaved(note) {
    setNotes((current) => upsertNote(current, note));
  }

  function handleFilesSaved(nextFiles) {
    setFiles(nextFiles);
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" onAuthSuccess={setUser} user={user} />} />
      <Route
        path="/get-started"
        element={<AuthPage mode="register" onAuthSuccess={setUser} user={user} />}
      />
      <Route
        path="/dashboard"
        element={
          <DashboardPage
            files={files}
            isLoading={workspaceStatus.isLoading}
            notes={notes}
            onFilesSaved={handleFilesSaved}
            onLogout={handleLogout}
            onRefresh={loadWorkspaceData}
            user={user}
            workspaceError={workspaceStatus.errorMessage}
          />
        }
      />
      <Route
        path="/editor"
        element={<EditorPage notes={notes} onSave={handleNoteSaved} user={user} />}
      />
      <Route
        path="/editor/:noteId"
        element={<EditorPage notes={notes} onSave={handleNoteSaved} user={user} />}
      />
    </Routes>
  );
}

function HomePage() {
  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="site-header">
        <nav className="navbar">
          <Link className="brand" to="/">
            <span className="brand-mark">S</span>
            <span className="brand-name">Syntax</span>
          </Link>

          <div className="nav-actions">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#pricing" className="nav-link">
              Pricing
            </a>
            <Link to="/login" className="button button-secondary">
              Login
            </Link>
            <Link to="/get-started" className="button button-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero section-frame">
          <div className="hero-copy reveal">
            <p className="eyebrow">MERN stack foundation for modern products</p>
            <h1>Build fast. Sync instantly. Scale with clean full-stack structure.</h1>
            <p className="hero-text">
              Syntax gives your application a sharp launchpad with real-time behavior, safer data
              contracts, and a polished interface built to move.
            </p>
            <div className="hero-actions">
              <Link to="/get-started" className="button button-primary">
                Start Building
              </Link>
              <a href="#pricing" className="button button-secondary">
                View Pricing
              </a>
            </div>
          </div>

          <div className="hero-panel reveal reveal-delay">
            <div className="hero-orbit">
              <div className="pulse-ring pulse-ring-large" />
              <div className="pulse-ring pulse-ring-small" />
              <div className="core-panel">
                <span className="core-label">Live Stack Health</span>
                <strong>99.98%</strong>
                <p>API, client, and database state stay aligned in real time.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section-frame features-section">
          <div className="section-heading reveal">
            <p className="eyebrow">Features</p>
            <h2>Capabilities designed to keep your application responsive and dependable.</h2>
          </div>

          <div className="feature-roller">
            <div className="feature-track">
              {[...featureCards, ...featureCards].map((feature, index) => (
                <article className="feature-card" key={`${feature.title}-${index}`}>
                  <span className="feature-index">0{(index % featureCards.length) + 1}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="section-frame pricing-section">
          <div className="section-heading reveal">
            <p className="eyebrow">Pricing</p>
            <h2>Simple subscription tiers for launch, growth, and scale.</h2>
          </div>

          <div className="pricing-grid">
            {pricingTiers.map((tier) => (
              <article
                className={`price-card${tier.featured ? " featured" : ""}`}
                key={tier.name}
              >
                <p className="tier-name">{tier.name}</p>
                <div className="tier-price">
                  <span>{tier.price}</span>
                  <small>/month</small>
                </div>
                <p className="tier-audience">{tier.audience}</p>
                <ul className="perk-list">
                  {tier.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                <Link to="/get-started" className="button button-primary full-width">
                  Choose {tier.name}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function AuthPage({ mode, onAuthSuccess, user }) {
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onAuthSuccess({
      name: form.name.trim() || form.email.split("@")[0] || "User",
      email: form.email.trim(),
    });

    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="simple-page auth-page">
      <Link className="brand brand-static" to="/">
        <span className="brand-mark">S</span>
        <span className="brand-name">Syntax</span>
      </Link>

      <div className="auth-layout">
        <section className="auth-intro reveal">
          <p className="eyebrow">{isLogin ? "Welcome back" : "Start with Syntax"}</p>
          <h1>{isLogin ? "Login to continue building." : "Create your Syntax workspace."}</h1>
          <p className="auth-text">
            {isLogin
              ? "Access your files, uploads, and saved editor notes from the backend."
              : "Register once, land in your dashboard, and start working with live server data."}
          </p>
        </section>

        <form className="auth-card reveal reveal-delay" onSubmit={handleSubmit}>
          {!isLogin ? (
            <label className="field">
              <span>Name</span>
              <input
                name="name"
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="button button-primary full-width">
            {isLogin ? "Login" : "Create Account"}
          </button>

          <p className="auth-switch">
            {isLogin ? "Need an account?" : "Already have an account?"}{" "}
            <Link to={isLogin ? "/get-started" : "/login"}>
              {isLogin ? "Get started" : "Login"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function DashboardPage({
  files,
  isLoading,
  notes,
  onFilesSaved,
  onLogout,
  onRefresh,
  user,
  workspaceError,
}) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState({
    isUploading: false,
    errorMessage: "",
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileUpload(event) {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    setUploadStatus({ isUploading: true, errorMessage: "" });

    try {
      const uploadedFiles = await Promise.all(selectedFiles.map(toUploadPayload));
      const savedFiles = await Promise.all(uploadedFiles.map((file) => saveFile(user.email, file)));
      onFilesSaved([...savedFiles, ...files.filter((file) => !savedFiles.some((saved) => saved.name === file.name))]);
      setUploadStatus({ isUploading: false, errorMessage: "" });
    } catch (error) {
      setUploadStatus({
        isUploading: false,
        errorMessage: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleDownloadFile(file) {
    try {
      const fullFile = await getFile(user.email, file.name);

      if (fullFile.content.startsWith("data:")) {
        const anchor = document.createElement("a");
        anchor.href = fullFile.content;
        anchor.download = fullFile.name;
        anchor.click();
        return;
      }

      downloadTextFile(fullFile.name, fullFile.content);
    } catch (error) {
      setUploadStatus({
        isUploading: false,
        errorMessage: error instanceof Error ? error.message : "Download failed",
      });
    }
  }

  function handleDownloadNote(note) {
    downloadTextFile(`${note.title || "Untitled"}.html`, note.content, "text/html;charset=utf-8");
  }

  return (
    <div className="simple-page dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-greeting">hi {user.name}</div>
          <button type="button" className="button button-secondary" onClick={onLogout}>
            Logout
          </button>
        </header>

        <section className="table-card">
          <div className="table-actions">
            <button
              type="button"
              className="button button-secondary button-icon"
              onClick={() => navigate("/editor")}
            >
              <span>+</span>
              Create Note
            </button>

            <div className="table-actions-right">
              <button type="button" className="button button-secondary" onClick={onRefresh}>
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
                  disabled={uploadStatus.isUploading}
                >
                  {uploadStatus.isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>

          {workspaceError ? <p className="status-message error">{workspaceError}</p> : null}
          {uploadStatus.errorMessage ? (
            <p className="status-message error">{uploadStatus.errorMessage}</p>
          ) : null}
          {isLoading ? <p className="status-message">Loading workspace...</p> : null}

          <div className="dashboard-grid">
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
                                onClick={() => navigate(`/editor/${note.id}`)}
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-message">No saved notes yet. Create one in the editor.</p>
              )}
            </div>

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
                              onClick={() => handleDownloadFile(file)}
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
                <p className="empty-message">No files yet. Upload one to store it on the server.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function EditorPage({ notes, onSave, user }) {
  const navigate = useNavigate();
  const { noteId } = useParams();
  const editorRef = useRef(null);
  const existingNote = noteId ? notes.find((item) => item.id === noteId) : null;
  const [title, setTitle] = useState(existingNote?.title ?? "Untitled");
  const [editorStatus, setEditorStatus] = useState({
    isLoading: false,
    isSaving: false,
    errorMessage: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!noteId) {
      setTitle("Untitled");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      return;
    }

    if (existingNote) {
      setTitle(existingNote.title);
      if (editorRef.current) {
        editorRef.current.innerHTML = existingNote.content;
      }
      return;
    }

    let isCancelled = false;

    async function loadNote() {
      setEditorStatus({ isLoading: true, isSaving: false, errorMessage: "" });

      try {
        const note = await getNote(user.email, noteId);

        if (isCancelled) {
          return;
        }

        setTitle(note.title);

        if (editorRef.current) {
          editorRef.current.innerHTML = note.content;
        }

        setEditorStatus({ isLoading: false, isSaving: false, errorMessage: "" });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setEditorStatus({
          isLoading: false,
          isSaving: false,
          errorMessage: error instanceof Error ? error.message : "Failed to load note",
        });
      }
    }

    void loadNote();

    return () => {
      isCancelled = true;
    };
  }, [existingNote, noteId, user]);

  if (!user) {
    return null;
  }

  function applyCommand(command, value) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  async function handleSave() {
    const trimmedTitle = title.trim() || "Untitled";
    const content = editorRef.current?.innerHTML ?? "";

    setEditorStatus({ isLoading: false, isSaving: true, errorMessage: "" });

    try {
      const savedNote = noteId
        ? await updateNote(user.email, noteId, { title: trimmedTitle, content })
        : await createNote(user.email, { title: trimmedTitle, content });

      onSave(savedNote);
      navigate("/dashboard");
    } catch (error) {
      setEditorStatus({
        isLoading: false,
        isSaving: false,
        errorMessage: error instanceof Error ? error.message : "Failed to save note",
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
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Project name"
            />
          </div>

          <div className="editor-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/dashboard")}
            >
              Close Editor
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={handleSave}
              disabled={editorStatus.isSaving}
            >
              {editorStatus.isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </header>

        {editorStatus.errorMessage ? (
          <p className="status-message error">{editorStatus.errorMessage}</p>
        ) : null}
        {editorStatus.isLoading ? <p className="status-message">Loading note...</p> : null}

        <div className="toolbar">
          {toolbarActions.map((action) => (
            <button
              key={action.title}
              type="button"
              className="toolbar-button"
              title={action.title}
              onClick={() => applyCommand(action.command, action.value)}
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

function toUploadPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        content: typeof reader.result === "string" ? reader.result : "",
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default App;
