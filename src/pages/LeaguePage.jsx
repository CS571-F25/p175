import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { getLeagueById, getTeamsForLeague } from "../utils/leagueAndTeamStorage";
import { getDraftForLeague } from "../utils/draftStorage";
import { syncLiveScoresToBucket } from "../utils/golferStorage";
import { formatThru, formatScore } from "../utils/formatGolfer";
import LeagueNavbar from "../components/LeagueNavbar";

export default function LeaguePage() {
  const { leagueId } = useParams();
  const [leagueName, setLeagueName] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDraftComplete, setIsDraftComplete] = useState(false);
  const [noDraft, setNoDraft] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg("");
        setIsDraftComplete(false);
        setNoDraft(false);

        // 1. Get league info
        const league = await getLeagueById(leagueId);
        setLeagueName(league.leagueName || "League");

        // 2. Get teams for that league
        const fetchedTeams = await getTeamsForLeague(league.leagueId);

        // 3. Get live golfers
        const golfers = await syncLiveScoresToBucket();

        // 4. Build golfer lookup by ID
        const golferMap = new Map(
          golfers.map((g) => [String(g.golferId), g])
        );

        // 5. Recompute each team's live total score from best 5 golfers
        const teamsWithLiveScores = fetchedTeams.map((team) => {
          const golferIds = Array.isArray(team.golferIds) ? team.golferIds : [];

          const teamGolfers = golferIds
            .map((id) => golferMap.get(String(id)))
            .filter(Boolean)
            .sort((a, b) => {
              if ((a.totalScore ?? 0) !== (b.totalScore ?? 0)) {
                return (a.totalScore ?? 0) - (b.totalScore ?? 0);
              }
              return (a.preTournamentRank || 999) - (b.preTournamentRank || 999);
            });

          const liveTotalScore = teamGolfers
            .slice(0, 5)
            .reduce((sum, g) => sum + (typeof g.totalScore === "number" ? g.totalScore : 0), 0);

          return {
            ...team,
            totalScore: liveTotalScore,
            golfers: teamGolfers,
          };
        });

        setTeams(teamsWithLiveScores);

        // 6. Check if the draft is complete — isolated so it can't crash the leaderboard
        let draft = null;
        try {
          draft = await getDraftForLeague(league.leagueId);
        } catch {
          // bucket may not exist yet if no draft has been created
        }
        const complete = !!draft && draft.inProgress === false;
        setIsDraftComplete(complete);
        setNoDraft(!complete);
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
      <LeagueNavbar active="leaderboard" />

      <div className="bb-league-pill-wrapper">
        <span className="bb-league-pill">
          {leagueName ? leagueName.toUpperCase() : "LOADING..."}
        </span>
      </div>

      <div className="bb-leaderboard-wrapper">
        <div className="bb-leaderboard-header bb-with-thru">
          <span className="bb-col-pos">Pos.</span>
          <span className="bb-col-name">Team Name</span>
          <span className="bb-col-thru">Thru</span>
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

        {!loading && !errorMsg && noDraft && (
          <div className="bb-leaderboard-error">
            You need to draft a team first dumbass
          </div>
        )}

        {!loading &&
          !errorMsg &&
          !noDraft &&
          [...teams]
            .sort((a, b) => (a.totalScore ?? 0) - (b.totalScore ?? 0))
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
                <span className="bb-col-name">
                  <div className="bb-team-name">{team.displayName}</div>
                </span>
                <span className="bb-col-thru"></span>
                <span className="bb-col-score">{formatScore(team.totalScore)}</span>

                {/* Golfer lines span all 4 columns */}
                <div className="bb-team-golfers">
                  {(team.golfers || []).map((g) => (
                    <div key={g.golferId} className="bb-team-golfer-line">
                      <span className="bb-team-golfer-spacer"></span>
                      <span className="bb-team-golfer-name">
                        <div>
                          {g.golferName}
                          {g.status === "cut" && (
                            <span style={{ marginLeft: "0.35rem", fontSize: "0.68rem", color: "#dc2626", fontWeight: 700 }}>
                              CUT
                            </span>
                          )}
                        </div>
                      </span>
                      <span className="bb-team-golfer-thru">{formatThru(g)}</span>
                      <span className="bb-team-golfer-score">{formatScore(g.totalScore)}</span>
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
      </div>
    </div>
  );
}
