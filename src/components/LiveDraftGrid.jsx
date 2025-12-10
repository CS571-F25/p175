// Grid that displays the active draft 
import React, { useMemo } from "react";

const ROUNDS = 6; // 6 players per team

export default function LiveDraftGrid({ draft, teams }) {
  if (!draft) return null;

  const numTeams = draft.numberOfTeams || teams.length || 0;
  if (!numTeams) {
    return <p>No teams found for this draft.</p>;
  }

  const orderedTeamIds =
    Array.isArray(draft.teamOrder) && draft.teamOrder.length
      ? draft.teamOrder
      : teams.map((t) => t.teamId || t.id);

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

  const picksByOverall = useMemo(() => {
    const map = new Map();
    (draft.picks || []).forEach((p) => {
      if (typeof p.overallPick === "number") {
        map.set(p.overallPick, p);
      }
    });
    return map;
  }, [draft]);

  function buildColumnPicks(colIndex) {
    const picks = [];

    for (let round = 1; round <= ROUNDS; round++) {
      let pickInRound;
      if (round % 2 === 1) {
        pickInRound = colIndex + 1;
      } else {
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
          <div
            key={team.teamId || colIdx}
            className="bb-draft-grid-column"
          >
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
              {colPicks.map((pick) => {
                const pickRecord = picksByOverall.get(pick.overallPick);
                const cellClass = pickRecord
                  ? "bb-draft-pick-cell bb-draft-pick-cell--taken"
                  : "bb-draft-pick-cell";

                return (
                  <div
                    key={`${team.teamId}-${pick.overallPick}`}
                    className={cellClass}
                  >
                    {pickRecord ? (
                      <>
                        <div className="bb-pick-label">{pick.label}</div>
                        <div className="bb-pick-golfer">
                          {pickRecord.golferName ??
                            `Golfer #${pickRecord.golferId}`}
                        </div>
                        {pickRecord.golferCountry && (
                          <div className="bb-pick-country">
                            {pickRecord.golferCountry}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="bb-pick-label">{pick.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
