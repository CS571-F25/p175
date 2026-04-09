import { getAllGolfers, BUCKET_GOLFERS_URL, COMMON_HEADERS } from "./golfers";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?tournamentId=401811941";

// Normalize names for comparison: remove periods, extra spaces, lowercase
// "S. Scheffler" → "s scheffler", "K. Kitayama" → "k kitayama"
function normalizeName(name = "") {
  return name.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function buildScoreMap(espnData) {
  const competitors =
    espnData?.events?.[0]?.competitions?.[0]?.competitors ?? [];

  console.log(`[ESPN] Found ${competitors.length} competitors`);

  const map = new Map();

  competitors.forEach((c) => {
    const shortName = c.athlete?.shortName;
    const raw = c.score ?? "E";
    const score = raw === "E" ? 0 : parseInt(raw, 10);

    if (shortName) {
      const key = normalizeName(shortName);
      map.set(key, score);
      console.log(`[ESPN] Mapped: "${shortName}" → key="${key}", score=${score}`);
    }
  });

  return map;
}

export async function syncLiveScoresToBucket() {
  try {
    const espnRes = await fetch(ESPN_SCOREBOARD_URL);
    if (!espnRes.ok) throw new Error("ESPN fetch failed");
    const espnData = await espnRes.json();
    const scoreMap = buildScoreMap(espnData);

    const golfers = await getAllGolfers();
    console.log(`[Bucket] Found ${golfers.length} golfers`);

    const updated = golfers.map((g) => {
      const key = normalizeName(g.golferName);
      const liveScore = scoreMap.get(key);

      if (liveScore !== undefined) {
        console.log(`[Match] "${g.golferName}" → score ${liveScore}`);
      } else {
        console.warn(`[No match] "${g.golferName}" (key="${key}") not found in ESPN data`);
      }

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

    console.log("[Sync] Bucket updated successfully");
    return updated;
  } catch (err) {
    console.warn("Live score sync failed, falling back to bucket data:", err.message);
    return getAllGolfers();
  }
}