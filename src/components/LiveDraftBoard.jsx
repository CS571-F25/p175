// Display LiveDraftBoard

import React, { useMemo } from "react";
import LiveDraftGrid from "./LiveDraftGrid";

export default function LiveDraftBoard({ draft, teams }) {
  if (!draft) {
    return (
      <div className="bb-live-draft-empty">
        <p>No active draft for this league.</p>
      </div>
    );
  }

  // ---- Find the team currently drafting ----
  const currentTeam = useMemo(() => {
    if (!draft.currentUserIdPicking) return null;
    return teams.find(
      (t) => t.userId === draft.currentUserIdPicking
    );
  }, [draft, teams]);

  const currentTeamName =
    currentTeam?.username ||
    currentTeam?.teamName ||
    "Unknown Team";

  return (
    <div className="bb-live-draft-board">

      {/* ------- NOW DRAFTING TEXT -------- */}
      <h3 className="bb-now-drafting-text">
        Now Drafting: <span className="bb-now-drafting-name">{currentTeamName}</span>
      </h3>

      <LiveDraftGrid draft={draft} teams={teams} />
    </div>
  );
}
