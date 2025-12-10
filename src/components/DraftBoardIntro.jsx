// Page for Predraft on Draftboard

export default function DraftBoardIntro({ teamCount, onStartDraft, errorMsg }) {
  const plural = teamCount === 1 ? "team" : "teams";

  const hasTeams = teamCount > 0;

  return (
    <div className="bb-draft-board-intro">
      <p className="bb-draft-board-intro-text">
        {hasTeams
          ? `${teamCount} ${plural} currently in this league.`
          : "No teams have joined this league yet."}
      </p>

        <button className="bb-draft-start-btn" onClick={onStartDraft}>
        Start Draft
        </button>

        {errorMsg && (
        <p style={{ color: "#dc2626", marginTop: "10px", fontWeight: 500 }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
