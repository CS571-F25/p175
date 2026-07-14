import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLeaguesForUser } from "../utils/leagueAndTeamStorage";

const TABS = [
  { key: "leaderboard", label: "Leaderboard", path: "" },
  { key: "my-team",     label: "My Team",     path: "/my-team" },
  { key: "draft",       label: "Draftboard",  path: "/draft" },
  { key: "field-tracker", label: "Field Tracker", path: "/field-tracker" },
];

export default function LeagueNavbar({ active = "leaderboard" }) {
  const navigate = useNavigate();
  const { leagueId } = useParams();
  const { user } = useAuth();

  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    if (!user) return;
    getLeaguesForUser(user.id)
      .then((all) =>
        setLeagues([...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      )
      .catch(() => {});
  }, [user]);

  function handlePoolChange(e) {
    const newId = e.target.value;
    const tab = TABS.find((t) => t.key === active);
    navigate(`/league/${newId}${tab?.path ?? ""}`);
  }

  function goTo(tab) {
    navigate(`/league/${leagueId}${tab.path}`);
  }

  return (
    <div className="bb-subnav">
      <select
        className="bb-subnav-pool-select"
        value={leagueId}
        onChange={handlePoolChange}
      >
        {leagues.map((l) => (
          <option key={l.leagueId} value={l.leagueId}>
            {l.leagueName}
          </option>
        ))}
      </select>

      <div className="bb-subnav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`bb-subnav-link ${active === tab.key ? "bb-subnav-link-active" : ""}`}
            onClick={() => goTo(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
