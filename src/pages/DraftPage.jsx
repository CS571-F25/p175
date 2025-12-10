// Page that displays draft

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import DraftRankingsPanel from "../components/DraftRankingsPanel";
import LeagueNavbar from "../components/LeagueNavbar";
import DraftBoardIntro from "../components/DraftBoardIntro";
import LiveDraftBoard from "../components/LiveDraftBoard";
import { getAllGolfers } from "../utils/golferStorage";
import { getTeamsForLeague, getLeagueById } from "../utils/leagueAndTeamStorage";
import { useAuth } from "../context/AuthContext";
import { createDraftForLeague } from "../utils/draftStorage";


export default function DraftPage() {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loadingLeague, setLoadingLeague] = useState(true);

  // TODO: replace with real "whose turn is it" logic
  const [isMyTurn] = useState(true);

  const [golfersRaw, setGolfersRaw] = useState([]);
  const [loadingGolfers, setLoadingGolfers] = useState(true);

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [draftStarted, setDraftStarted] = useState(false);
  const [draftError, setDraftError] = useState("");

  const { user } = useAuth();

  const [errorMsg, setErrorMsg] = useState("");

  // Load golfers from bb-golfers
  useEffect(() => {
    let cancelled = false;

    async function loadGolfers() {
      try {
        setLoadingGolfers(true);
        setErrorMsg("");

        const golfers = await getAllGolfers();
        if (!cancelled) {
          setGolfersRaw(golfers);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setErrorMsg(err.message || "Failed to load golfer rankings.");
        }
      } finally {
        if (!cancelled) {
          setLoadingGolfers(false);
        }
      }
    }

    loadGolfers();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load teams for this league
  useEffect(() => {
    if (!leagueId) return;

    let cancelled = false;

    async function loadTeams() {
      try {
        setLoadingTeams(true);

        const fetchedTeams = await getTeamsForLeague(leagueId);
        if (!cancelled) {
          setTeams(fetchedTeams);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          // Reuse the same errorMsg area for now
          setErrorMsg(err.message || "Failed to load league teams.");
        }
      } finally {
        if (!cancelled) {
          setLoadingTeams(false);
        }
      }
    }

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, [leagueId]);

    // Load leagues from bb-leageus
  useEffect(() => {
  if (!leagueId) return;

  let cancelled = false;

  async function loadLeague() {
    try {
      setLoadingLeague(true);
      const lg = await getLeagueById(leagueId);
      if (!cancelled) {
        setLeague(lg);
      }
    } catch (err) {
      if (!cancelled) {
        console.error(err);
        setErrorMsg("Failed to load league.");
      }
    } finally {
      if (!cancelled) {
        setLoadingLeague(false);
      }
    }
  }

  loadLeague();
  return () => { cancelled = true };
}, [leagueId]);

  // Sort golfers
  const golfers = useMemo(
    () =>
      [...golfersRaw].sort(
        (a, b) => a.preTournamentRank - b.preTournamentRank
      ),
    [golfersRaw]
  );

  function handleDraft(golfer) {
    console.log("Drafting golfer: ", golfer);
    // later: call bucket to mark golfer drafted + update team, board, etc.
  }

  async function handleStartDraft() {
    if (!league || !user) return;

    if (user.id !== league.ownerId) {
      setDraftError("Only the owner of this league can start the draft.");
      return;
    }

    try {
      setDraftError("");

      const newDraft = await createDraftForLeague(league.leagueId);
      setDraft(newDraft);
      setDraftStarted(true);

      console.log("Draft created:", newDraft);
    } catch (err) {
      console.error(err);
      setDraftError(err.message || "Failed to start draft.");
    }
  }

  const isLoadingAnything = loadingGolfers || loadingTeams || loadingLeague;

  return (
    <div className="bb-draft-page">
      <LeagueNavbar active="draft" />

      <div className="bb-draft-main">
        <DraftRankingsPanel
          golfers={golfers}
          canDraft={true}
          onDraft={handleDraft}
        />

        <main className="bb-draft-board-shell">
          <h2 className="bb-draft-board-title">Draft Board</h2>

          {isLoadingAnything && (
            <div className="bb-draft-board-placeholder">
              <p>Loading draft data…</p>
            </div>
          )}

          {!isLoadingAnything && errorMsg && (
            <div className="bb-draft-board-placeholder">
              <p style={{ color: "#dc2626" }}>{errorMsg}</p>
            </div>
          )}

          {/* Intro state – draft not started yet */}
          {!isLoadingAnything && !errorMsg && !draftStarted && (
            <div className="bb-draft-board-placeholder">
              <DraftBoardIntro
                teamCount={teams.length}
                onStartDraft={handleStartDraft}
                errorMsg={draftError}
              />
            </div>
          )}

          {/* Live draft state */}
          {!isLoadingAnything && !errorMsg && draftStarted && (
            // Use the full area instead of the dashed placeholder box
            <LiveDraftBoard draft={draft} teams={teams} />
          )}
        </main>
      </div>
    </div>
  );
}