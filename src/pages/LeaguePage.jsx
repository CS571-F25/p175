// Page that shows all teams in a league in a scoreboard format based on totalScore

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { getLeagueById, getTeamsForLeague } from "../utils/leagueAndTeamStorage";
import { getDraftForLeague } from "../utils/draftStorage";
import LeagueNavbar from "../components/LeagueNavbar";

export default function LeaguePage() {
  const { leagueId } = useParams();
  const [leagueName, setLeagueName] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDraftComplete, setIsDraftComplete] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg("");
        setIsDraftComplete(false);

        // 1. Get league info
        const league = await getLeagueById(leagueId);
        setLeagueName(league.leagueName || "League");

        // 2. Get teams for that league
        const fetchedTeams = await getTeamsForLeague(league.leagueId);
        setTeams(fetchedTeams);

        // 3. Check if the draft is complete (medals only show once done)
        const draft = await getDraftForLeague(league.leagueId);
        setIsDraftComplete(!!draft && draft.inProgress === false);
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

  return (
    <div className="bb-league-page">
      {/* Secondary nav — full width */}
      <LeagueNavbar active="leaderboard" />

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
          [...teams]
            .sort(
              (a, b) => (a.totalScore ?? 0) - (b.totalScore ?? 0)
            )
            .map((team, idx) => {
              let rankClass = "";

              if (isDraftComplete && idx === 0) {
                rankClass = "bb-rank-first";
              } else if (isDraftComplete && idx === 1) {
                rankClass = "bb-rank-second";
              } else if (isDraftComplete && idx === 2) {
                rankClass = "bb-rank-third";
              }

              return (
                <div
                  key={team.id || idx}
                  className={`bb-leaderboard-row ${rankClass}`.trim()}
                >
                  <span className="bb-col-pos">{idx + 1}.</span>
                  <span className="bb-col-name bb-team-name">
                    {team.displayName}
                  </span>
                  <span className="bb-col-score">{team.totalScore}</span>
                </div>
              );
            })}
      </div>
    </div>
  );
}