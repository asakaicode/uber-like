import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { gql, setToken } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

const LOGIN_MUTATION = graphql(`
  mutation UserLogin($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`);

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await gql(LOGIN_MUTATION, { email, password });
      setToken(data.login.token);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: "4rem" }}>
      <div className="card">
        <h1>ログイン</h1>
        <form onSubmit={handleSubmit}>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button className="btn" type="submit">ログイン</button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#666" }}>
          テスト: customer@example.com / password123
        </p>
      </div>
    </div>
  );
}
