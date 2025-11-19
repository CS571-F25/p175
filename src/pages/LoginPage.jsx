// Page with login form for existing users

// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    // TODO: replace with real auth (Bucket API) later
    if (!username || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    // fake login for now
    login();
    navigate("/");
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
                />
                </Form.Group>

                <Form.Group className="mb-4" controlId="login-password">
                <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-pill px-4 py-3"
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
