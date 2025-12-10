// Display LiveDraftBoard

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

  return (
    <div className="bb-live-draft-board">
      {/* Later we can add "Round X – On the clock: Team Y" here */}
      <LiveDraftGrid draft={draft} teams={teams} />
    </div>
  );
}