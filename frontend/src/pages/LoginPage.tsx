import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authClient } from "../services/api";
import { useSessionStore } from "../state/session";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setSession } = useSessionStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await authClient.login({ email, password });
      setSession({ token: response.access_token, user: { email } });
      navigate("/");
    } catch (err) {
      setError("Unable to login, please check your credentials");
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>ModernReader</h1>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
};
