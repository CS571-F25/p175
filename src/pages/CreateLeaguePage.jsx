// Page to create a new league (name, settings)

import { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createLeague } from "../utils/leagueAndTeamStorage";
import PageContainer from "../components/PageContainer";
import PageHeader from "../components/PageHeader";
import LabeledInput from "../components/LabeledInput";

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
    <PageContainer className="mt-5" style={{ maxWidth: "760px" }}>
      <PageHeader
        title="Create a new PGA Draft Pool"
        subtitle="Name your league and set a password so friends can join"
        align="center"
      />

      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Form onSubmit={handleSubmit} aria-label="Create pool form">
          <LabeledInput
            id="create-league-name"
            label="League Name"
            type="text"
            placeholder="Enter league name"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            className="rounded-pill px-4 py-3"
          />

          <LabeledInput
            id="create-league-password"
            label="Pool Password"
            type="password"
            placeholder="Enter pool password"
            value={poolPassword}
            onChange={(e) => setPoolPassword(e.target.value)}
            className="rounded-pill px-4 py-3"
          />

          {errorMsg && (
            <div className="text-danger small mb-2" role="alert">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-100 rounded-pill py-3 mt-2"
          >
            Create Pool
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
    </PageContainer>
  );
}
