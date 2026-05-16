/**
 * Format hole status for display in the UI.
 * Examples: "F" (finished round), "thru 8", "Tee: 1:50 PM", "—"
 */
export function formatThru(golfer) {
  if (!golfer) return "—";

  const { status, holesThru, teeTime } = golfer;

  if (status === "finished") return "F";
  if (status === "round-done") return "F";
  if (status === "cut") return "—";
  if (status === "pre") return teeTime ? formatTeeTime(teeTime) : "—";
  if (status === "live") return holesThru > 0 ? `thru ${holesThru}` : "—";

  return "—";
}

function formatTeeTime(raw) {
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw; // fallback if parse fails

  return date.toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format score: 0 → "E", -5 → "-5", 3 → "+3"
 */
export function formatScore(score) {
  if (score === 0 || score == null) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}