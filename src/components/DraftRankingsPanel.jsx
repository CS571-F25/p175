// Component to display golfers in order from their preDraftRank on Draft Page

import { useState, useMemo } from "react";

export default function DraftRankingsPanel({
  golfers = [],
  canDraft = false,
  onDraft,
}) {
  const [hoveredId, setHoveredId] = useState(null);

  // Always sorted by preTournamentRank
  const sortedGolfers = useMemo(
    () =>
      [...golfers].sort(
        (a, b) => a.preTournamentRank - b.preTournamentRank
      ),
    [golfers]
  );

  return (
    <aside className="bb-draft-rankings">
      <h2 className="bb-draft-rankings-title">Rankings</h2>

      <div className="bb-draft-rankings-table-wrapper">
        <table className="bb-draft-rankings-table">
          <thead>
            <tr>
              <th className="bb-draft-col-rank">Rank</th>
              <th className="bb-draft-col-player">Player</th>
              <th className="bb-draft-col-country">Country</th>
            </tr>
          </thead>
          <tbody>
            {sortedGolfers.map((g) => {
              const isHovered = hoveredId === g.golferId;

              return (
                <tr
                  key={g.golferId}
                  className={`bb-draft-row ${
                    isHovered ? "bb-draft-row-hover" : ""
                  }`}
                  onMouseEnter={() => setHoveredId(g.golferId)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <td className="bb-draft-col-rank">
                    {g.preTournamentRank}
                  </td>

                  <td className="bb-draft-col-player">
                    <span className="bb-draft-player-name">
                      {g.golferName}
                    </span>

                    {canDraft && isHovered && (
                      <button
                        type="button"
                        className="bb-draft-btn"
                        onClick={() => onDraft && onDraft(g)}
                      >
                        Draft
                      </button>
                    )}
                  </td>

                  <td className="bb-draft-col-country">
                    {g.country}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
