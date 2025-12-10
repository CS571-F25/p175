// Page with login form for existing users

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { authenticateUser } from "../utils/userStorage";
import { getLeaguesForUser } from "../utils/leagueAndTeamStorage";
import AuthFormLayout from "../components/AuthFormLayout";
import LabeledInput from "../components/LabeledInput";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!username || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    try {
      const user = await authenticateUser(username, password);
      login({ id: user.id || user.userId, username: user.username });

      const leagues = await getLeaguesForUser(user.id || user.userId);

      if (leagues.length > 0) {
        const league = leagues[0];
        navigate(`/league/${league.leagueId}`, {
          state: { leagueName: league.leagueName },
        });
      } else {
        navigate("/");
      }
    } catch (err) {
      setErrorMsg(err.message || "Login failed. Please try again.");
    }
  }

  return (
    <AuthFormLayout
      title="Log in to your account"
      subtitle="Access your pools, drafts, and leaderboards"
      footer={
        <p className="mb-0">
          Don’t have an account? <Link to="/register">Sign up</Link>
        </p>
      }
    >
      <Form onSubmit={handleSubmit} noValidate>
        <LabeledInput
          id="login-username"
          label="Username"
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <LabeledInput
          id="login-password"
          label="Password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {errorMsg && (
          <div className="text-danger small mb-2" role="alert">
            {errorMsg}
          </div>
        )}

        <Button
          type="submit"
          className="w-100 rounded-pill py-2 mt-2"
          variant="primary"
        >
          Log In
        </Button>
      </Form>
    </AuthFormLayout>
  );
}
