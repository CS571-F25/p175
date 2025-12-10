import { useNavigate, useParams } from "react-router-dom";

export default function LeagueNavbar({ active = "leaderboard" }) {
  const navigate = useNavigate();
  const { leagueId } = useParams();

  function goTo(tab) {
    if (tab === "leaderboard") {
      navigate(`/league/${leagueId}`);
    } else if (tab === "team") {
      navigate(`/league/${leagueId}/team`);
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
          active === "team" ? "bb-subnav-link-active" : ""
        }`}
        onClick={() => goTo("team")}
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
