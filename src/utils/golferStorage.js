import { getAllGolfers, BUCKET_GOLFERS_URL, COMMON_HEADERS } from "./golfers";

// ─── Sync live ESPN scores into your bb-golfers bucket ───────────────────────

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?tournamentId=401811941";

/**
 * Parse the raw ESPN response into a simple name→score map.
 * "E" is converted to 0. "-3" → -3, "+2" → 2.
 */
function buildScoreMap(espnData) {
  const competitors =
    espnData?.events?.[0]?.competitions?.[0]?.competitors ?? [];

  const map = new Map();

  competitors.forEach((c) => {
    const shortName = c.athlete?.shortName; // e.g. "T. Fleetwood"
    const raw = c.score ?? "E";             // e.g. "-3", "E", "+2"
    const score = raw === "E" ? 0 : parseInt(raw, 10);

    if (shortName) map.set(shortName, score);
  });

  return map;
}

/**
 * Fetch live scores from ESPN and patch your bucket golfers.
 * Writes updated totalScore back to the bucket, then returns
 * the updated golfer array so your UI stays on the getAllGolfers path.
 */
export async function syncLiveScoresToBucket() {
  try {
    const espnRes = await fetch(ESPN_SCOREBOARD_URL);
    if (!espnRes.ok) throw new Error("ESPN fetch failed");
    const espnData = await espnRes.json();
    const scoreMap = buildScoreMap(espnData);

    const golfers = await getAllGolfers();
    const updated = golfers.map((g) => {
      const liveScore = scoreMap.get(g.golferName);
      return liveScore !== undefined ? { ...g, totalScore: liveScore } : g;
    });

    const byBucket = updated.reduce((acc, g) => {
      if (!acc[g.bucketId]) acc[g.bucketId] = [];
      acc[g.bucketId].push(g);
      return acc;
    }, {});

    await Promise.all(
      Object.entries(byBucket).map(([bucketId, golferGroup]) =>
        fetch(`${BUCKET_GOLFERS_URL}/${bucketId}`, {
          method: "PUT",
          headers: COMMON_HEADERS,
          body: JSON.stringify(golferGroup),
        })
      )
    );

    return updated;
  } catch (err) {
    // ESPN is down or changed — fall back to bucket scores silently
    console.warn("Live score sync failed, falling back to bucket data:", err.message);
    return getAllGolfers();
  }
}