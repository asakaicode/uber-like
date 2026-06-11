import { useNavigate } from "@tanstack/react-router";
import { LoginForm, gql, setProfileIds, setToken } from "@uber-like/web";
import { graphql } from "@uber-like/web/gql";

const LOGIN_MUTATION = graphql(`
  mutation RestaurantLogin($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      restaurantId
    }
  }
`);

export function LoginPage() {
  const navigate = useNavigate();

  async function handleSubmit(email: string, password: string) {
    const data = await gql(LOGIN_MUTATION, { email, password });
    setToken(data.login.token);
    if (data.login.restaurantId) {
      setProfileIds({ restaurantId: data.login.restaurantId });
    }
    navigate({ to: "/" });
  }

  return (
    <LoginForm
      title="店舗ログイン"
      defaultEmail="restaurant1@example.com"
      hint="restaurant1@example.com / password123"
      onSubmit={handleSubmit}
    />
  );
}
