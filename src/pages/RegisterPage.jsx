// Page with registration form for new users

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    // basic validation for now
    if (!username || !password || !confirmPassword) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    // TODO: call real signup endpoint (Bucket API) later.
    // For now, pretend signup succeeded and log them in.
    login();
    navigate("/");
  }

  return (
    <div>
      <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <div>
          <h1 className="mb-4 text-center">CREATE A NEW ACCOUNT</h1>

          <Form onSubmit={handleSubmit} className="w-100">
            <Form.Group className="mb-3" controlId="register-username">
              <Form.Control
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-pill px-4 py-3"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="register-password">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-pill px-4 py-3"
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="register-confirm-password">
              <Form.Control
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-pill px-4 py-3"
              />
            </Form.Group>

            <Button
              type="submit"
              className="w-100 rounded-pill py-2"
              variant="primary"
            >
              Sign Up
            </Button>

            {errorMsg && (
              <div className="text-danger small mt-2 text-center">
                {errorMsg}
              </div>
            )}
          </Form>

          <p className="mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login">
              Log in
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}