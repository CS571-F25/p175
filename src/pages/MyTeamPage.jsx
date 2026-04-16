// Populated after draft with your teams players and their score

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import LeagueNavbar from "../components/LeagueNavbar";
import { useAuth } from "../context/AuthContext";
import {
  getLeagueById,
  getTeamsForLeague,
} from "../utils/leagueAndTeamStorage";
import { syncLiveScoresToBucket } from "../utils/golferStorage";
import { formatThru, formatScore } from "../utils/formatGolfer";


export default function MyTeamPage() {
  const { leagueId } = useParams();
  const { user } = useAuth();

  const [leagueName, setLeagueName] = useState("");
  const [myTeam, setMyTeam] = useState(null);
  const [allGolfers, setAllGolfers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!leagueId || !user) return;

    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg("");

        // 1. League info
        const league = await getLeagueById(leagueId);
        if (!cancelled) {
          setLeagueName(league.leagueName || "League");
        }

        // 2. Teams in this league
        const teams = await getTeamsForLeague(leagueId);
        const mine = teams.find((t) => t.userId === user.id) || null;

        if (!mine) {
          if (!cancelled) {
            setErrorMsg("You don't have a team in this league yet.");
            setMyTeam(null);
          }
          return;
        }

        if (!cancelled) {
          setMyTeam(mine);
        }

        // 3. All golfers so we can look up names/scores
        const golfers = await syncLiveScoresToBucket();
        if (!cancelled) {
          setAllGolfers(golfers);
          console.log("allGolfers sample", golfers.slice(0, 5));
          console.log("myTeam golferIds", myTeam?.golferIds);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setErrorMsg(err.message || "Failed to load your team.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [leagueId, user]);

  // ---- derive my golfers + sort by best score ----
  const myGolfersSorted = useMemo(() => {
  if (!myTeam || !Array.isArray(myTeam.golferIds)) {
    console.log("myTeam missing or golferIds not array", myTeam);
    return [];
  }

  console.log("myTeam.golferIds raw:", myTeam.golferIds);
  console.log("allGolfers length:", allGolfers.length);

  const idSet = new Set((myTeam.golferIds || []).map(String));
  console.log("idSet:", [...idSet]);

  console.log(
    "all golfer ids sample:",
    allGolfers.slice(0, 15).map((g) => ({
      golferId: String(g.golferId),
      golferName: g.golferName,
      totalScore: g.totalScore,
    }))
  );

  const mine = allGolfers.filter((g) => idSet.has(String(g.golferId)));

  console.log(
    "matching golfers:",
    mine.map((g) => ({
      golferId: g.golferId,
      golferName: g.golferName,
      totalScore: g.totalScore,
    }))
  );

  return mine.sort((a, b) => {
    if (a.totalScore !== b.totalScore) {
      return a.totalScore - b.totalScore;
    }
    return (a.preTournamentRank || 999) - (b.preTournamentRank || 999);
  });
}, [myTeam, allGolfers]);

  // ---- total team score (best five golfers only) ----
  const totalTeamScore = useMemo(() => {
    if (!myGolfersSorted.length) {
      return myTeam && typeof myTeam.totalScore === "number"
        ? myTeam.totalScore
        : 0;
    }

    return myGolfersSorted.slice(0, 5).reduce((sum, g) => {
      if (typeof g.totalScore === "number") {
        return sum + g.totalScore;
      }
      return sum;
    }, 0);
  }, [myTeam, myGolfersSorted]);

  const usernameLabel = user?.username
    ? `${user.username}'s Team`
    : "My Team";

  return (
    <div className="bb-league-page">
      {/* Sub-nav: Leaderboard / My Team / Draft */}
      <LeagueNavbar active="team" />

      {/* Username pill at the top */}
      <div className="bb-league-pill-wrapper">
        <span className="bb-league-pill">
          {usernameLabel.toUpperCase()}
        </span>
      </div>

      {/* Small subtitle for league name */}
      {leagueName && (
        <p
          style={{
            textAlign: "center",
            marginTop: "12px",
            marginBottom: "12px",
            color: "#6b7280",
          }}
        >
          League: {leagueName}
        </p>
      )}

      {/* Total team score just under league name */}
      {!loading && !errorMsg && myTeam && (
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <p
            style={{
              marginBottom: "4px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Total Team Score:{" "}
            <span style={{ color: "#2563eb" }}>{totalTeamScore}</span>
          </p>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.65rem" }}>
            *Only your best five golfers count; any dropped score is highlighted in red.*
          </p>
        </div>
      )}

      {/* Table of golfers on this team */}
      <div className="bb-leaderboard-wrapper">
        <div className="bb-leaderboard-header bb-with-thru">
          <span className="bb-col-pos">Pos.</span>
          <span className="bb-col-name">Golfer</span>
          <span className="bb-col-thru">Thru</span>
          <span className="bb-col-score">Score</span>
        </div>
        
        {errorMsg && !loading && (
          <div className="bb-leaderboard-error">{errorMsg}</div>
        )}

        {loading && (
          <div className="bb-leaderboard-loading">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Loading your team…</span>
          </div>
        )}

        {!loading &&
          !errorMsg &&
          myGolfersSorted.map((g, idx) => {
            const rowClassName = [
              "bb-leaderboard-row",
              "bb-with-thru",
              idx < 5 ? "bb-row-top-five" : "bb-row-dropped",
            ].join(" ");

            return (
              <div key={g.golferId} className={rowClassName}>
                <span className="bb-col-pos">{idx + 1}.</span>
                <span className="bb-col-name bb-team-name">
                  {g.golferName}
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.8rem",
                      color: "#6b7280",
                    }}
                  >
                    {g.country}
                  </span>
                </span>
                <span 
                  className="bb-col-thru"
                >
                  {formatThru(g)}
                </span>
                  <span className="bb-col-score">{formatScore(g.totalScore)}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
