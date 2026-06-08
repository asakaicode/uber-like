import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { gql, setToken } from "@uber-like/web";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("restaurant1@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await gql<{ login: { token: string; restaurantId: string | null } }>(
        `mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) { token restaurantId }
        }`,
        { email, password },
      );
      setToken(data.login.token);
      if (data.login.restaurantId) {
        localStorage.setItem("restaurantId", data.login.restaurantId);
      }
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: "4rem" }}>
      <div className="card">
        <h1>店舗ログイン</h1>
        <form onSubmit={handleSubmit}>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button className="btn" type="submit">ログイン</button>
        </form>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>restaurant1@example.com / password123</p>
      </div>
    </div>
  );
}
