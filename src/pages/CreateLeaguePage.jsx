// Page to create a new league (name, settings)

import { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createLeague } from "../utils/leagueAndTeamStorage";

export default function CreateLeaguePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [leagueName, setLeagueName] = useState("");
  const [poolPassword, setPoolPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!leagueName.trim() || !poolPassword.trim()) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    if (!user) {
      setErrorMsg("You must be logged in to create a league.");
      return;
    }

    try {
        const { league, team } = await createLeague({
        ownerUsername: user.username,
        leagueName,
        leaguePassword: poolPassword,
        });

        console.log("Created league:", league);
        console.log("Created team for owner:", team);

      // Navigate to league page on success
        navigate(`/league/${league.leagueId}`, {
          state: { leagueName: league.leagueName },
        });
        
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong creating your league.");
    }
  }

  function handleBack() {
    navigate(-1);
  }

  return (
    <Container className="text-center mt-5" style={{ maxWidth: "800px" }}>
      {/* Title */}
      <h1 className="mb-2">Create a New</h1>
      <h1 className="mb-4">PGA Draft Pool</h1>

      {/* Form wrapper */}
      <div style={{ maxWidth: "450px", margin: "0 auto" }}>
        <Form onSubmit={handleSubmit}>
          
          {/* League Name */}
          <Form.Group className="mb-3 text-start" controlId="create-league-name">
            <Form.Label>League Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter league name"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="rounded-pill px-4 py-3"
            />
          </Form.Group>

          {/* Pool Password */}
          <Form.Group
            className="mb-3 text-start"
            controlId="create-league-password"
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
            <div className="text-danger small mb-2 text-start">
              {errorMsg}
            </div>
          )}

          {/* Create button */}
          <Button
            type="submit"
            variant="primary"
            className="w-100 rounded-pill py-3 mt-2"
          >
            Create Pool
          </Button>

          {/* Back */}
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