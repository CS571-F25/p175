// Subnav present on league pages
// Navigate between leaderboard, my team, and draftboard

import { useNavigate, useParams } from "react-router-dom";

export default function LeagueNavbar({ active = "leaderboard" }) {
  const navigate = useNavigate();
  const { leagueId } = useParams();

  function goTo(tab) {
    if (tab === "leaderboard") {
      navigate(`/league/${leagueId}`);
    } else if (tab === "my-team") {
      navigate(`/league/${leagueId}/my-team`);
    } else if (tab === "draft") {
      navigate(`/league/${leagueId}/draft`);
    }
  }

  return (
    <div className="bb-subnav">
      <button
        className={`bb-subnav-link ${
          active === "leaderboard" ? "bb-subnav-link-active" : ""
        }`}
        onClick={() => goTo("leaderboard")}
      >
        Leaderboard
      </button>

      <button
        className={`bb-subnav-link ${
          active === "my-team" ? "bb-subnav-link-active" : ""
        }`}
        onClick={() => goTo("my-team")}
      >
        My Team
      </button>

      <button
        className={`bb-subnav-link ${
          active === "draft" ? "bb-subnav-link-active" : ""
        }`}
        onClick={() => goTo("draft")}
      >
        Draft
      </button>
    </div>
  );
}
