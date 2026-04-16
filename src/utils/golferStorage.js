import { getAllGolfers, BUCKET_GOLFERS_URL, COMMON_HEADERS } from "./golfers";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?tournamentId=401811942";

// Normalize names for comparison: remove periods, extra spaces, lowercase
function normalizeName(name = "") {
  return name
    .normalize("NFD")                     // decompose: "Å" → "A" + combining ring
    .replace(/[\u0300-\u036f]/g, "")      // strip combining marks
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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
    if (!espnRes.ok) throw new Error(`ESPN fetch failed: ${espnRes.status}`);

    const espnData = await espnRes.json();
    const scoreMap = buildScoreMap(espnData);

    const golfers = await getAllGolfers();
    console.log(`[Bucket] Found ${golfers.length} golfers`);

    const updated = golfers.map((g) => {
      const key = normalizeName(g.golferName);
      const liveScore = scoreMap.get(key);

      if (liveScore !== undefined) {
        console.log(`[Match] "${g.golferName}" → score ${liveScore}`);
        return { ...g, totalScore: liveScore };
      } else {
        console.warn(
          `[No match] "${g.golferName}" (key="${key}") not found in ESPN data`
        );
        return g;
      }
    });

    const byBucket = updated.reduce((acc, g) => {
      if (!acc[g.bucketId]) acc[g.bucketId] = [];
      acc[g.bucketId].push(g);
      return acc;
    }, {});

    try {
      const putResults = await Promise.all(
        Object.entries(byBucket).map(async ([bucketId, golferGroup]) => {
          const payload = golferGroup.map(({ bucketId, ...rest }) => rest);

          const url = `${BUCKET_GOLFERS_URL}/${bucketId}`;
          console.log("[PUT] url:", url);
          console.log("[PUT] payload sample:", payload.slice(0, 2));

          const res = await fetch(url, {
            method: "PUT",
            headers: COMMON_HEADERS,
            body: JSON.stringify(payload),
          });

          const text = await res.text();
          console.log("[PUT] status:", res.status, "bucketId:", bucketId);
          console.log("[PUT] response text:", text);

          if (!res.ok) {
            throw new Error(
              `Bucket PUT failed for ${bucketId}: ${res.status} ${text}`
            );
          }

          return { bucketId, status: res.status, text };
        })
      );

      console.log("[PUT] success results:", putResults);
      console.log("[Sync] Bucket updated successfully");
    } catch (putErr) {
      console.warn(
        "[Sync] Bucket update failed, but returning live scores to UI:",
        putErr.message
      );
    }

    return updated;
  } catch (err) {
    console.warn(
      "Live score sync failed before UI update, falling back to bucket data:",
      err.message
    );
    return getAllGolfers();
  }
}