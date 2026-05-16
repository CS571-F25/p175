import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import LeagueNavbar from "../components/LeagueNavbar";
import { getLeagueById, getTeamsForLeague } from "../utils/leagueAndTeamStorage";
import { getDraftForLeague } from "../utils/draftStorage";
import { syncLiveScoresToBucket, getTournamentName } from "../utils/golferStorage";
import { formatThru, formatScore } from "../utils/formatGolfer";

function assignPositions(sorted) {
  const result = [];
  let i = 0;
  while (i < sorted.length) {
    const score = sorted[i].totalScore;
    let j = i;
    while (j < sorted.length && sorted[j].totalScore === score) j++;
    const tied = j - i > 1;
    const posLabel = tied ? `T${i + 1}` : `${i + 1}`;
    for (let k = i; k < j; k++) {
      result.push({ ...sorted[k], posLabel });
    }
    i = j;
  }
  return result;
}

export default function FieldTrackerPage() {
  const { leagueId } = useParams();

  const [leagueName, setLeagueName] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [allGolfers, setAllGolfers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!leagueId) return;
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg("");

        const [league, golfers, leagueTeams, tName, draftData] = await Promise.all([
          getLeagueById(leagueId),
          syncLiveScoresToBucket(),
          getTeamsForLeague(leagueId),
          getTournamentName(),
          getDraftForLeague(leagueId).catch(() => null),
        ]);

        if (cancelled) return;

        setLeagueName(league.leagueName || "League");
        setAllGolfers(golfers);
        setTeams(leagueTeams);
        setTournamentName(tName);
        setDraft(draftData);
      } catch (err) {
        console.error(err);
        if (!cancelled) setErrorMsg(err.message || "Failed to load field data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [leagueId]);

  // Build golferId → team displayName map
  const golferToTeam = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => {
      (team.golferIds || []).forEach((id) => {
        map.set(String(id), team.displayName);
      });
    });
    return map;
  }, [teams]);

  // Build golferId → overall pick number map
  const golferToPickNum = useMemo(() => {
    const map = new Map();
    (draft?.picks ?? []).forEach((pick) => {
      if (pick.golferId != null) {
        map.set(String(pick.golferId), pick.overallPick);
      }
    });
    return map;
  }, [draft]);

  // Sort all golfers: by score asc, then started players before pre-round at same score
  const sortedGolfers = useMemo(() => {
    const sorted = [...allGolfers].sort((a, b) => {
      if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
      const aStarted = a.status !== "pre" ? 0 : 1;
      const bStarted = b.status !== "pre" ? 0 : 1;
      if (aStarted !== bStarted) return aStarted - bStarted;
      return (a.preTournamentRank || 999) - (b.preTournamentRank || 999);
    });
    return assignPositions(sorted);
  }, [allGolfers]);

  return (
    <div className="bb-league-page">
      <LeagueNavbar active="field-tracker" />

      <div className="bb-league-pill-wrapper">
        <span className="bb-league-pill">
          {tournamentName ? tournamentName.toUpperCase() : "FIELD TRACKER"}
        </span>
      </div>

      {leagueName && (
        <p style={{ textAlign: "center", marginTop: "12px", marginBottom: "12px", color: "#6b7280" }}>
          League: {leagueName}
        </p>
      )}

      <div className="bb-field-tracker-wrapper">
        <div className="bb-field-tracker-header">
          <span className="bb-col-pos">Pos.</span>
          <span className="bb-col-name">Golfer</span>
          <span className="bb-col-thru">Thru</span>
          <span className="bb-col-score">Score</span>
          <span className="bb-col-pick">Pick No.</span>
          <span className="bb-col-team">Team</span>
        </div>

        {errorMsg && !loading && (
          <div className="bb-leaderboard-error">{errorMsg}</div>
        )}

        {loading && (
          <div className="bb-leaderboard-loading">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Loading field…</span>
          </div>
        )}

        {!loading &&
          !errorMsg &&
          sortedGolfers.map((g) => {
            const teamName = golferToTeam.get(String(g.golferId));
            const isDrafted = !!teamName;
            const pickNum = golferToPickNum.get(String(g.golferId));

            return (
              <div
                key={g.golferId}
                className={`bb-field-tracker-row${isDrafted ? " bb-ft-row-drafted" : ""}`}
              >
                <span className="bb-col-pos">{g.posLabel}</span>
                <span className="bb-col-name bb-team-name">
                  {g.golferName}
                  {g.status === "cut" && (
                    <span style={{ marginLeft: "0.4rem", fontSize: "0.72rem", color: "#dc2626", fontWeight: 700 }}>
                      CUT
                    </span>
                  )}
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
                    {g.country}
                  </span>
                </span>
                <span className="bb-col-thru">{formatThru(g)}</span>
                <span className="bb-col-score">{formatScore(g.totalScore)}</span>
                <span className="bb-col-pick">{pickNum != null ? pickNum : "—"}</span>
                <span className={`bb-col-team ${isDrafted ? "bb-ft-team-drafted" : "bb-ft-team-undrafted"}`}>
                  {isDrafted ? teamName : "Undrafted"}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
