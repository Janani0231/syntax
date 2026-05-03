import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  loginThunk,
  registerThunk,
  selectAuthError,
  selectAuthStatus,
} from "@/store/authSlice";
import { ROUTES } from "@/routes/paths";

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface AuthPageProps {
  mode: "login" | "register";
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);
  const isLogin = mode === "login";
  const isSubmitting = authStatus === "loading";
  const redirectTo =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "object" &&
    location.state.from !== null &&
    "pathname" in location.state.from &&
    typeof location.state.from.pathname === "string"
      ? location.state.from.pathname
      : ROUTES.dashboard;

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const credentials = {
      email: form.email.trim(),
      password: form.password,
    };

    try {
      if (isLogin) {
        await dispatch(loginThunk(credentials)).unwrap();
      } else {
        await dispatch(
          registerThunk({
            ...credentials,
            name: form.name.trim(),
          }),
        ).unwrap();
      }

      navigate(redirectTo, { replace: true });
    } catch {
      // The Redux auth slice stores and renders the API error message.
    }
  }

  return (
    <div className="simple-page auth-page">
      <Link className="brand brand-static" to={ROUTES.home}>
        <span className="brand-mark">S</span>
        <span className="brand-name">Syntax</span>
      </Link>

      <div className="auth-layout">
        <section className="auth-intro reveal">
          <p className="eyebrow">
            {isLogin ? "Welcome back" : "Start with Syntax"}
          </p>
          <h1>
            {isLogin
              ? "Login to continue building."
              : "Create your Syntax workspace."}
          </h1>
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
            <div className="password-input-wrap">
              <input
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={
                  isPasswordVisible ? "Hide password" : "Show password"
                }
                aria-pressed={isPasswordVisible}
                title={isPasswordVisible ? "Hide password" : "Show password"}
              >
                {isPasswordVisible ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          {authError ? (
            <p className="status-message error">{authError}</p>
          ) : null}

          <button
            type="submit"
            className="button button-primary full-width"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Please wait…"
              : isLogin
                ? "Login"
                : "Create Account"}
          </button>

          <p className="auth-switch">
            {isLogin ? "Need an account?" : "Already have an account?"}{" "}
            <Link to={isLogin ? ROUTES.register : ROUTES.login}>
              {isLogin ? "Get started" : "Login"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
