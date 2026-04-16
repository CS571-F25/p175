/**
 * Format hole status for display in the UI.
 * Examples: "F" (finished round), "thru 8", "Tee: 1:50 PM", "—"
 */
export function formatThru(golfer) {
  if (!golfer) return "—";

  const { status, holesThru, teeTime } = golfer;

  if (status === "finished") return "F";
  if (status === "round-done") return "F"; // finished round, more rounds to come
  if (status === "pre") return teeTime ? teeTime : "—";
  if (status === "live") return holesThru > 0 ? `thru ${holesThru}` : "—";

  // Fallback for golfers with no live data (e.g. withdrew, not in field)
  return "—";
}

/**
 * Format score: 0 → "E", -5 → "-5", 3 → "+3"
 */
export function formatScore(score) {
  if (score === 0 || score == null) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}