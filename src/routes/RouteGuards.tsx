import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";
import { selectIsAuthenticated } from "@/store/authSlice";
import { ROUTES } from "@/routes/paths";

export function RequireAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
