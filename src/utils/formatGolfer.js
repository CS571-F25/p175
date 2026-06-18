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
  // ESPN always labels tee times as PDT/PST regardless of venue timezone.
  // Replace with the actual venue offset — US Open (Shinnecock Hills, NY) is EDT = GMT-0400.
  const corrected = raw
    .replace(/\bPDT\b/g, "GMT-0400")
    .replace(/\bPST\b/g, "GMT-0500");
  const date = new Date(corrected);
  if (isNaN(date.getTime())) return raw;

  return date.toLocaleTimeString("en-US", {
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

/**
 * Format per-round scores as a string (e.g. "R1: -3  R2: +1  R3: E")
 * Returns null when no round data is available.
 */
export function formatRoundScores(roundScores) {
  if (!roundScores) return null;
  const parts = [1, 2, 3, 4]
    .filter((r) => roundScores[r] !== undefined)
    .map((r) => `R${r}: ${formatScore(roundScores[r])}`);
  return parts.length ? parts.join("  ") : null;
}
