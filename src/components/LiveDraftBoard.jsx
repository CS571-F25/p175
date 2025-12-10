// src/components/LiveDraftBoard.jsx
import React from "react";
import LiveDraftGrid from "./LiveDraftGrid";

export default function LiveDraftBoard({ draft, teams }) {
  if (!draft) {
    return (
      <div className="bb-live-draft-empty">
        <p>No active draft for this league.</p>
      </div>
    );
  }

  // figure out who is on the clock
  let currentName = "Draft complete";
  if (draft.inProgress && draft.currentUserIdPicking) {
    const currentTeam = teams.find(
      (t) => t.userId === draft.currentUserIdPicking
    );
    currentName = currentTeam?.username || currentTeam?.teamName || "Unknown team";
  }

  return (
    <div className="bb-live-draft-board">
      <h3 className="bb-live-draft-now">
        {draft.inProgress
          ? `Now Drafting: ${currentName}`
          : "Draft Complete"}
      </h3>

      <LiveDraftGrid draft={draft} teams={teams} />
    </div>
  );
}
