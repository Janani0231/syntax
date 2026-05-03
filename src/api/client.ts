import type {
  AppFile,
  AuthCredentials,
  AuthSession,
  CreateFileInput,
  CreateNoteInput,
  Note,
  RegisterCredentials,
  UpdateNoteInput,
} from "@/types";

// ─── Base ─────────────────────────────────────────────────────────────────────

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000"
).replace(/\/$/, "");

interface RequestOptions extends RequestInit {
  token?: string;
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOptions.headers ?? {}),
      },
    });
  } catch (error) {
    throw new Error(
      `Network error connecting to ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const responseText = await response.text();
  const payload = responseText ? (JSON.parse(responseText) as T) : null;

  if (!response.ok) {
    const errPayload = payload as { message?: string } | null;
    throw new Error(
      errPayload?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return payload as T;
}

// ─── Authentication ──────────────────────────────────────────────────────────

export async function registerUser(
  credentials: RegisterCredentials,
): Promise<AuthSession> {
  return apiRequest<AuthSession>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function loginUser(
  credentials: AuthCredentials,
): Promise<AuthSession> {
  return apiRequest<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function getCurrentUser(
  token: string,
): Promise<AuthSession["user"]> {
  const payload = await apiRequest<{ user: AuthSession["user"] }>(
    "/api/auth/me",
    {
      token,
    },
  );
  return payload.user;
}

export async function logoutUser(token?: string | null): Promise<void> {
  await apiRequest<null>("/api/auth/logout", {
    token: token ?? undefined,
    method: "POST",
  });
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function listNotes(token: string): Promise<Note[]> {
  const payload = await apiRequest<{ notes: Note[] }>("/api/notes", { token });
  return payload.notes;
}

export async function getNote(token: string, id: string): Promise<Note> {
  const payload = await apiRequest<{ note: Note }>(
    `/api/notes/${encodeURIComponent(id)}`,
    { token },
  );
  return payload.note;
}

export async function createNote(
  token: string,
  note: CreateNoteInput,
): Promise<Note> {
  const payload = await apiRequest<{ note: Note }>("/api/notes", {
    token,
    method: "POST",
    body: JSON.stringify(note),
  });
  return payload.note;
}

export async function updateNote(
  token: string,
  id: string,
  note: UpdateNoteInput,
): Promise<Note> {
  const payload = await apiRequest<{ note: Note }>(
    `/api/notes/${encodeURIComponent(id)}`,
    {
      token,
      method: "PUT",
      body: JSON.stringify(note),
    },
  );
  return payload.note;
}

export async function deleteNote(token: string, id: string): Promise<void> {
  await apiRequest<null>(`/api/notes/${encodeURIComponent(id)}`, {
    token,
    method: "DELETE",
  });
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function listFiles(token: string): Promise<AppFile[]> {
  const payload = await apiRequest<{ files: AppFile[] }>("/api/files", {
    token,
  });
  return payload.files;
}

export async function getFile(
  token: string,
  name: string,
): Promise<AppFile & { content: string }> {
  const payload = await apiRequest<{ file: AppFile & { content: string } }>(
    `/api/files/${encodeURIComponent(name)}`,
    { token },
  );
  return payload.file;
}

async function createFile(
  token: string,
  file: CreateFileInput,
): Promise<AppFile> {
  const payload = await apiRequest<{ file: AppFile }>("/api/files", {
    token,
    method: "POST",
    body: JSON.stringify(file),
  });
  return payload.file;
}

async function updateFile(
  token: string,
  name: string,
  content: string,
): Promise<AppFile> {
  const payload = await apiRequest<{ file: AppFile }>(
    `/api/files/${encodeURIComponent(name)}`,
    {
      token,
      method: "PUT",
      body: JSON.stringify({ content }),
    },
  );
  return payload.file;
}

export async function saveFile(
  token: string,
  file: CreateFileInput,
): Promise<AppFile> {
  try {
    return await createFile(token, file);
  } catch (error) {
    if (error instanceof Error && error.message === "File already exists") {
      return updateFile(token, file.name, file.content);
    }
    throw error;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function toUploadPayload(file: File): Promise<CreateFileInput> {
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
