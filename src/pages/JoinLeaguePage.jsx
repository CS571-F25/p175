// Page to join an existing league via code/ID

import { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { joinLeague } from "../utils/leagueAndTeamStorage";
import PageContainer from "../components/PageContainer";
import PageHeader from "../components/PageHeader";
import LabeledInput from "../components/LabeledInput";

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
    <PageContainer className="mt-5" style={{ maxWidth: "760px" }}>
      <PageHeader
        title="Join an existing PGA Draft Pool"
        subtitle="Enter the league name and password shared by the organizer"
        align="center"
      />

      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <Form onSubmit={handleSubmit} aria-label="Join pool form">
          <LabeledInput
            id="join-pool-name"
            label="Pool Name"
            type="text"
            placeholder="Enter pool name"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            className="rounded-pill px-4 py-3"
          />

          <LabeledInput
            id="join-pool-password"
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
    </PageContainer>
  );
}
