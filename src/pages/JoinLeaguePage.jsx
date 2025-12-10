// Page to join an existing league via code/ID

import { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { joinLeague } from "../utils/leagueAndTeamStorage";

export default function JoinLeaguePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [poolName, setPoolName] = useState("");
  const [poolPassword, setPoolPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!user) {
      setErrorMsg("You must be logged in to join a pool.");
      return;
    }

    if (!poolName.trim() || !poolPassword.trim()) {
      setErrorMsg("Please fill out both fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { league, team } = await joinLeague({
        leagueName: poolName,
        poolPassword,
        username: user.username,
      });

      console.log("Joined league:", league);
      console.log("Created team:", team);

      // Go to league page on success
      navigate(`/league/${league.leagueId}`, {
        state: { leagueName: league.leagueName },
      });

    } catch (err) {
      setErrorMsg(err.message || "Failed to join pool.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    navigate(-1);
  }

   return (
    <Container className="text-center mt-5" style={{ maxWidth: "800px" }}>
      {/* Title */}
      <h1 className="mb-2">Join an existing</h1>
      <h1 className="mb-4">PGA Draft Pool</h1>

      {/* Form wrapper */}
      <div style={{ maxWidth: "450px", margin: "0 auto" }}>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3 text-start" controlId="join-pool-name">
            <Form.Label>Pool Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter pool name"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              className="rounded-pill px-4 py-3"
            />
          </Form.Group>

          <Form.Group
            className="mb-3 text-start"
            controlId="join-pool-password"
          >
            <Form.Label>Pool Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter pool password"
              value={poolPassword}
              onChange={(e) => setPoolPassword(e.target.value)}
              className="rounded-pill px-4 py-3"
            />
          </Form.Group>

          {errorMsg && (
            <div className="text-danger small mb-2 text-start">{errorMsg}</div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-100 rounded-pill py-3 mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Joining..." : "Join Pool"}
          </Button>

          <Button
            type="button"
            variant="outline-secondary"
            className="w-100 rounded-pill py-2 mt-3"
            onClick={handleBack}
          >
            Back
          </Button>
        </Form>
      </div>
    </Container>
  );
}