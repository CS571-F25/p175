// src/pages/LeaguePage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import {
  getLeagueById,
  getTeamsForLeague,
} from "../utils/leagueAndTeamStorage";

export default function LeaguePage() {
  const { leagueId } = useParams();
  const navigate = useNavigate();

  const [leagueName, setLeagueName] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg("");

        // 1. Get league info
        const league = await getLeagueById(leagueId);
        setLeagueName(league.leagueName || "League");

        // 2. Get teams for that league
        const fetchedTeams = await getTeamsForLeague(league.leagueId);
        setTeams(fetchedTeams);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || "Could not load leaderboard.");
      } finally {
        setLoading(false);
      }
    }

    if (leagueId) {
      loadData();
    }
  }, [leagueId]);

  function goTo(tab) {
    if (tab === "leaderboard") {
      navigate(`/league/${leagueId}`);
    } else if (tab === "my-team") {
      navigate(`/league/${leagueId}/my-team`);
    } else if (tab === "draft") {
      navigate(`/league/${leagueId}/draft`);
    }
  }

  return (
    <div className="bb-league-page">
      {/* Secondary nav — full width */}
      <div className="bb-subnav">
        <button
          className="bb-subnav-link bb-subnav-link-active"
          onClick={() => goTo("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          className="bb-subnav-link"
          onClick={() => goTo("my-team")}
        >
          My Team
        </button>
        <button
          className="bb-subnav-link"
          onClick={() => goTo("draft")}
        >
          Draft
        </button>
      </div>

      {/* League name pill */}
      <div className="bb-league-pill-wrapper">
        <span className="bb-league-pill">
          {leagueName ? leagueName.toUpperCase() : "LOADING..."}
        </span>
      </div>

      {/* Leaderboard area */}
      <div className="bb-leaderboard-wrapper">
        <div className="bb-leaderboard-header">
          <span className="bb-col-pos">Pos.</span>
          <span className="bb-col-name">Team Name</span>
          <span className="bb-col-score">Score</span>
        </div>

        {errorMsg && !loading && (
          <div className="bb-leaderboard-error">{errorMsg}</div>
        )}

        {loading && (
          <div className="bb-leaderboard-loading">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Loading leaderboard...</span>
          </div>
        )}

        {!loading &&
          !errorMsg &&
          teams.map((team, idx) => (
            <div key={team.id || idx} className="bb-leaderboard-row">
              <span className="bb-col-pos">{idx + 1}.</span>
              <span className="bb-col-name bb-team-name">
                {team.displayName}
              </span>
              <span className="bb-col-score">{team.totalScore}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
