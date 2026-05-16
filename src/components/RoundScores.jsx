import { formatScore } from "../utils/formatGolfer";

export default function RoundScores({ roundScores }) {
  if (!roundScores) return null;
  const rounds = [1, 2, 3, 4].filter((r) => roundScores[r] !== undefined);
  if (!rounds.length) return null;

  return (
    <div style={{ display: "flex", gap: "0.55rem", marginTop: "3px" }}>
      {rounds.map((r) => {
        const score = roundScores[r];
        const scoreColor = score < 0 ? "#16a34a" : score > 0 ? "#dc2626" : "#6b7280";
        return (
          <span key={r} style={{ fontSize: "0.68rem" }}>
            <span style={{ color: "#9ca3af" }}>R{r} </span>
            <span style={{ color: scoreColor, fontWeight: 700 }}>{formatScore(score)}</span>
          </span>
        );
      })}
    </div>
  );
}
