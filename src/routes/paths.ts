export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/get-started",
  dashboard: "/dashboard",
  editor: "/editor",
  editorDetail: "/editor/:noteId",
} as const;

export function editorRoute(noteId?: string): string {
  return noteId ? `${ROUTES.editor}/${encodeURIComponent(noteId)}` : ROUTES.editor;
}
