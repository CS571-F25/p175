// Page with registration form for new users

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { createUser } from "../utils/userStorage";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
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

    try {
      // Create and save user to Bucket (with hashing)
      const newUser = await createUser({ username, password });

      // Log them in using AuthContext
      // We can use a fake "token" that includes their local id
      login({ id: newUser.id, username: newUser.username });

      navigate("/");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong creating your account.");
    }
  }


  return (
    <div>
      <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <div>
          <h1 className="mb-4 text-center">CREATE A NEW ACCOUNT</h1>

          <Form onSubmit={handleSubmit} className="w-100">
          <Form.Group className="mb-3" controlId="register-username">
            <Form.Label className="visually-hidden">Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-pill px-4 py-3"
              autoComplete="username"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="register-password">
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-pill px-4 py-3"
              autoComplete="new-password"
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="register-confirm-password">
            <Form.Control
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-pill px-4 py-3"
              autoComplete="new-password"
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