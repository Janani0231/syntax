import { Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import EditorPage from "@/pages/EditorPage";
import { GuestOnly, RequireAuth } from "@/routes/RouteGuards";
import { ROUTES } from "@/routes/paths";

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomePage />} />

      <Route element={<GuestOnly />}>
        <Route path={ROUTES.login} element={<AuthPage mode="login" />} />
        <Route path={ROUTES.register} element={<AuthPage mode="register" />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.editor} element={<EditorPage />} />
        <Route path={ROUTES.editorDetail} element={<EditorPage />} />
      </Route>
    </Routes>
  );
}
