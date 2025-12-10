// src/pages/DraftPage.jsx
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
import {
  createDraftForLeague,
  getDraftForLeague,
} from "../utils/draftStorage";

export default function DraftPage() {
  const { leagueId } = useParams();
  const { user } = useAuth();

  const [league, setLeague] = useState(null);

  const [golfersRaw, setGolfersRaw] = useState([]);
  const [loadingGolfers, setLoadingGolfers] = useState(true);

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [draft, setDraft] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true);

  const [draftError, setDraftError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ---- Load golfers ----
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

  // ---- Load teams for this league ----
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

  // ---- Load league info ----
  useEffect(() => {
    if (!leagueId) return;
    let cancelled = false;

    async function loadLeague() {
      try {
        const lg = await getLeagueById(leagueId);
        if (!cancelled) {
          setLeague(lg);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setErrorMsg("Failed to load league.");
        }
      }
    }

    loadLeague();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

// ---- Load + poll draft for this league ----
useEffect(() => {
  if (!leagueId) return;
  let cancelled = false;

  async function loadDraftOnce({ showSpinner = false } = {}) {
    try {
      if (showSpinner) {
        setLoadingDraft(true);
      }

      const existing = await getDraftForLeague(leagueId);
      if (!cancelled) {
        setDraft(existing);
      }
    } catch (err) {
      if (!cancelled) {
        console.error(err);
        // optional: setErrorMsg once here if you want
      }
    } finally {
      if (!cancelled && showSpinner) {
        setLoadingDraft(false);
      }
    }
  }

  // initial load: show spinner
  loadDraftOnce({ showSpinner: true });

  // poll every 15s in the background (no spinner)
  const intervalId = setInterval(() => {
    loadDraftOnce({ showSpinner: false });
  }, 15000);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}, [leagueId]);

  // ---- Derived data ----
  const golfers = useMemo(
    () =>
      [...golfersRaw].sort(
        (a, b) => a.preTournamentRank - b.preTournamentRank
      ),
    [golfersRaw]
  );

  const draftStarted = !!draft && draft.inProgress;

  // ---- Handlers ----
  function handleDraft(golfer) {
    console.log("Drafting golfer: ", golfer);
    // later: update draft + team via updateDraftInBucket
  }

  async function handleStartDraft() {
    if (!league || !user) return;

    if (user.id !== league.ownerId) {
      setDraftError("Only the owner of this league can start the draft.");
      return;
    }

    try {
      setDraftError("");

      // team order (for now: whatever order teams are in; later you can randomize)
      const teamOrder = teams.map((t) => t.teamId || t.id);

      const newDraft = await createDraftForLeague(league.leagueId, teamOrder);
      setDraft(newDraft); // our own page updates immediately
      console.log("Draft created:", newDraft);
    } catch (err) {
      console.error(err);
      setDraftError(err.message || "Failed to start draft.");
    }
  }

  const isLoadingAnything = loadingGolfers || loadingTeams || loadingDraft;

  // ---- Render ----
  return (
    <div className="bb-draft-page">
      <LeagueNavbar active="draft" />

      <div className="bb-draft-main">
        {/* Left panel: Rankings */}
        <DraftRankingsPanel
          golfers={golfers}
          canDraft={true}
          onDraft={handleDraft}
        />

        {/* Right panel: Draft Board shell */}
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

          {!isLoadingAnything && !errorMsg && !draftStarted && (
            <div className="bb-draft-board-placeholder">
              <DraftBoardIntro
                teamCount={teams.length}
                onStartDraft={handleStartDraft}
                errorMsg={draftError}
              />
            </div>
          )}

          {!isLoadingAnything && !errorMsg && draftStarted && (
            <div className="bb-draft-board-placeholder">
              {/* Wire your actual grid here */}
              <LiveDraftBoard draft={draft} teams={teams} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
