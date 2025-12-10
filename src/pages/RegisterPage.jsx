// Page with registration form for new users

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { createUser } from "../utils/userStorage";
import AuthFormLayout from "../components/AuthFormLayout";
import LabeledInput from "../components/LabeledInput";

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

    if (!username || !password || !confirmPassword) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      const newUser = await createUser({ username, password });
      // Store the generated userId immediately so owner checks work without requiring re-login
      login({ id: newUser.userId, userId: newUser.userId, username: newUser.username });
      navigate("/");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong creating your account.");
    }
  }

  return (
    <AuthFormLayout
      title="Create a new account"
      subtitle="Set up your BirdieBoard profile in moments"
      footer={
        <p className="mb-0">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      }
    >
      <Form onSubmit={handleSubmit} noValidate>
        <LabeledInput
          id="register-username"
          label="Username"
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <LabeledInput
          id="register-password"
          label="Password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <LabeledInput
          id="register-confirm-password"
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
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
          Sign Up
        </Button>
      </Form>
    </AuthFormLayout>
  );
}
