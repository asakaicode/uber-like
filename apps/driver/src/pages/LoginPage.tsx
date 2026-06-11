import { useNavigate } from "@tanstack/react-router";
import { LoginForm, gql, setToken } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

const LOGIN_MUTATION = graphql(`
  mutation DriverLogin($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`);

export function LoginPage() {
  const navigate = useNavigate();

  async function handleSubmit(email: string, password: string) {
    const data = await gql(LOGIN_MUTATION, { email, password });
    setToken(data.login.token);
    navigate({ to: "/" });
  }

  return (
    <LoginForm
      title="ドライバーログイン"
      defaultEmail="driver1@example.com"
      hint="driver1@example.com / password123"
      onSubmit={handleSubmit}
    />
  );
}
