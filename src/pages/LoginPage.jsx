// Page with login form for existing users

// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { authenticateUser } from "../utils/userStorage";

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

      // store id + username in AuthContext
      login({ id: user.id, username: user.username });

      navigate("/");
    } catch (err) {
      setErrorMsg(err.message || "Login failed. Please try again.");
    }
  }

    return (
    <div>
        <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <div>
            <h1 className="mb-4 text-center">LOG IN TO YOUR ACCOUNT</h1>
            <Form onSubmit={handleSubmit} className="w-100">
            <Form.Group className="mb-3" controlId="login-username">
              <Form.Control
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-pill px-4 py-3"
                autoComplete="username"
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="login-password">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-pill px-4 py-3"
                autoComplete="current-password"
              />
            </Form.Group>

                <Button
                type="submit"
                className="w-100 rounded-pill py-2"
                variant="primary"
                >
                Log In
                </Button>

                {errorMsg && (
                <div className="text-danger small mt-2 text-center">
                    {errorMsg}
                </div>
                )}
            </Form>

            <p className="mt-4 text-center">
                Don’t have an account?{" "}
                <Link to="/register">
                Sign up
                </Link>
            </p>
        </div>
      </Container>
    </div>
  );
}
