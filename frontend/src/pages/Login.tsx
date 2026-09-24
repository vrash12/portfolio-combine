import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { api } from "../api/client";
import { useAuth } from "../auth/useAuth";

type LoginResponse = {
  message: string;
  mfaRequired?: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

function Login() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
        ...(otp ? { otp } : {}),
      });

      if (response.data.mfaRequired) {
        setMfaRequired(true);
        return;
      }

      const user = await refreshSession();

      if (!user) {
        setErrorMessage("The secure session could not be established.");
        return;
      }

      navigate("/blogs/new");
    } catch (error) {
      console.error("Login failed:", error);

      const requestError = error as AxiosError<{ message?: string }>;
      setErrorMessage(
        requestError.response?.data?.message || "Login was unsuccessful."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="page-hero blog-adventure-hero">
        <p className="section-kicker">Admin Access</p>

        <h1>Login</h1>

        <p>Login to create and manage your adventure blog posts.</p>
      </section>

      <section className="content-section">
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your administrator email"
              autoComplete="username"
              maxLength={254}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              maxLength={256}
              required
            />
          </label>

          {mfaRequired && (
            <>
              <p className="form-success">
                Enter the six-digit code from your authenticator app.
              </p>

              <label>
                Authenticator Code
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />
              </label>
            </>
          )}

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="btn" type="submit" disabled={loading}>
            {loading
              ? "Verifying..."
              : mfaRequired
                ? "Verify and Login"
                : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
