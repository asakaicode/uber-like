import { useState } from "react";

interface LoginFormProps {
  title: string;
  defaultEmail: string;
  hint: string;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ title, defaultEmail, hint, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: "4rem" }}>
      <div className="card">
        <h1>{title}</h1>
        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button className="btn" type="submit">
            ログイン
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#666" }}>{hint}</p>
      </div>
    </div>
  );
}
