// Grid that displays the active draft
import React from "react";

/**
 * Props:
 *  - draft: {
 *      numberOfTeams: number,
 *      teamOrder: string[] // array of teamIds in draft order
 *    }
 *  - teams: [
 *      { teamId, id, username?, teamName? , ... }
 *    ]
 */
const ROUNDS = 6; // 6 players per team

export default function LiveDraftGrid({ draft, teams }) {
  if (!draft) return null;

  const numTeams = draft.numberOfTeams || teams.length || 0;
  if (!numTeams) {
    return <p>No teams found for this draft.</p>;
  }

  // teamOrder is an array of teamIds in draft order
  const orderedTeamIds = Array.isArray(draft.teamOrder) && draft.teamOrder.length
    ? draft.teamOrder
    : teams.map((t) => t.teamId || t.id);

  // Map team order -> display object
  const orderedTeams = orderedTeamIds.map((tid, idx) => {
    const t = teams.find(
      (team) => team.teamId === tid || team.id === tid
    );
    const displayName =
      t?.username || t?.teamName || `Team ${idx + 1}`;
    return {
      teamId: tid,
      displayName,
    };
  });

  // Small helper: build the 6 picks for a given column (team)
  function buildColumnPicks(colIndex) {
    const picks = [];

    for (let round = 1; round <= ROUNDS; round++) {
      // for snake: figure out overall index and pick-in-round label
      let pickInRound;
      if (round % 2 === 1) {
        // odd round: 1 -> numTeams left to right
        pickInRound = colIndex + 1;
      } else {
        // even round: numTeams -> 1 right to left
        pickInRound = numTeams - colIndex;
      }

      const overallIndex =
        (round - 1) * numTeams +
        (round % 2 === 1 ? colIndex : numTeams - 1 - colIndex);
      const overallPick = overallIndex + 1;

      picks.push({
        round,
        pickInRound,
        overallPick,
        label: `${round}.${String(pickInRound).padStart(2, "0")}`,
      });
    }

    return picks;
  }

  return (
    <div className="bb-draft-grid">
      {orderedTeams.map((team, colIdx) => {
        const colPicks = buildColumnPicks(colIdx);

        return (
          <div key={team.teamId || colIdx} className="bb-draft-grid-column">
            {/* Team header pill */}
            <div className="bb-draft-team-header">
              <span className="bb-draft-team-initial">
                {team.displayName.charAt(0).toUpperCase()}
              </span>
              <span className="bb-draft-team-name">
                {team.displayName}
              </span>
            </div>

            {/* 6 pick slots */}
            <div className="bb-draft-pick-column-cells">
              {colPicks.map((pick) => (
                <div
                  key={`${team.teamId}-${pick.overallPick}`}
                  className="bb-draft-pick-cell"
                >
                  {pick.label}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
