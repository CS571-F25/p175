// Page that displays draftboard and golfers by ranking

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import DraftRankingsPanel from "../components/DraftRankingsPanel";
import LeagueNavbar from "../components/LeagueNavbar";
import DraftBoardIntro from "../components/DraftBoardIntro";
import LiveDraftBoard from "../components/LiveDraftBoard";

import { getAllGolfers } from "../utils/golfers";
import {
  getTeamsForLeague,
  getLeagueById,
  updateTeamsFromCompletedDraft,
} from "../utils/leagueAndTeamStorage";
import { useAuth } from "../context/AuthContext";
import {
  createDraftForLeague,
  getDraftForLeague,
  makePickOnDraft,
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

  // ---- Load golfers from bb-golfers ----
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

    // ---- Load + (conditionally) poll draft for this league ----
    useEffect(() => {
    if (!leagueId) return;

    let cancelled = false;
    let intervalId;

    async function loadDraftOnce(isFirstLoad = false) {
        try {
        if (isFirstLoad) {
            setLoadingDraft(true);
        }

        const existing = await getDraftForLeague(leagueId);

        if (!cancelled) {
            setDraft(existing || null);
            setLoadingDraft(false);
        }
        } catch (err) {
        if (!cancelled) {
            console.error(err);
            setLoadingDraft(false);
        }
        }
    }

    // initial load
    loadDraftOnce(true);

    // If there is no draft yet OR the draft is in progress,
    // keep polling. If it's completed, don't start an interval.
    if (!draft || draft.inProgress) {
        intervalId = setInterval(() => loadDraftOnce(false), 5000);
    }

    return () => {
        cancelled = true;
        if (intervalId) clearInterval(intervalId);
    };
    }, [leagueId, draft?.inProgress]);

  // ---- derived state ----

  const draftedGolferIds = useMemo(
    () => (draft?.picks || []).map((p) => p.golferId),
    [draft]
  );

  // golfers available to draft = all - already picked
  const availableGolfers = useMemo(
    () =>
      golfersRaw.filter(
        (g) => !draftedGolferIds.includes(g.golferId)
      ),
    [golfersRaw, draftedGolferIds]
  );

  const isLoadingAnything = loadingGolfers || loadingTeams || loadingDraft;

  const isMyTurn =
    !!user &&
    !!draft &&
    draft.inProgress &&
    draft.currentUserIdPicking === user.id;

  // ---- interactions ----

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
    } catch (err) {
      console.error(err);
      setDraftError(err.message || "Failed to start draft.");
    }
  }

  async function handleDraft(golfer) {
    if (!draft || !draft.inProgress) {
      setDraftError("Draft is not currently in progress.");
      return;
    }

    if (!user) {
      setDraftError("You must be logged in to draft.");
      return;
    }

    if (!isMyTurn) {
      setDraftError("It’s not your turn to draft.");
      return;
    }

    try {
      setDraftError("");

      const updated = await makePickOnDraft({
        draft,
        golfer,
        teams,
      });

      setDraft(updated);

    // If this pick finished the draft, update teams in bb-teams
    if (!updated.inProgress) {
      try {
        await updateTeamsFromCompletedDraft(updated, golfersRaw);
      } catch (e) {
        console.error(e);
        // Draft is done; teams just might not have updated—surface a soft warning.
        setDraftError(
          "Draft completed, but updating team scores failed. Please refresh or try again."
        );
      }
    }
  } catch (err) {
    console.error(err);
    setDraftError(err.message || "Failed to make pick.");
  }
}

    // Show intro only if *no* draft exists yet
    const showIntro = !draft;

    // Show the live board whenever a draft exists (whether inProgress or complete)
    const showLiveBoard = !!draft;

  return (
    <div className="bb-draft-page">
      <LeagueNavbar active="draft" />

      <div className="bb-draft-main">
        {/* Left panel: Rankings */}
        <DraftRankingsPanel
          golfers={availableGolfers}
          canDraft={isMyTurn}
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

          {!isLoadingAnything && !errorMsg && showIntro && (
            <div className="bb-draft-board-placeholder">
              <DraftBoardIntro
                teamCount={teams.length}
                onStartDraft={handleStartDraft}
                errorMsg={draftError}
              />
            </div>
          )}

          {!isLoadingAnything && !errorMsg && showLiveBoard && (
            <div className="bb-draft-board-live-wrapper">
              <LiveDraftBoard draft={draft} teams={teams} />
              {draftError && (
                <p
                  style={{
                    color: "#dc2626",
                    marginTop: "10px",
                    fontWeight: 500,
                  }}
                >
                  {draftError}
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
