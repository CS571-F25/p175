import { getAllGolfers, BUCKET_GOLFERS_URL, COMMON_HEADERS } from "./golfers";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?tournamentId=401811947";

function normalizeName(name = "") {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/gi, "o")
    .replace(/æ/gi, "ae")
    .replace(/ß/gi, "ss")
    .replace(/ł/gi, "l")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Given a competitor object from ESPN, return { holesThru, currentRound, status, teeTime }.
 * status: "pre" | "live" | "round-done" | "finished"
 *   pre         → hasn't started tournament (or hasn't teed off yet today)
 *   live        → mid-round
 *   round-done  → finished a round but not the tournament (waiting for next round)
 *   finished    → completed all scheduled rounds
 */
function getGolferStatus(competitor, totalRoundsInEvent = 4) {
  const periods = competitor.linescores ?? [];

  let holesThru = 0;
  let currentRound = 0;
  let completedRounds = 0;

  for (const period of periods) {
    const holes = period.linescores?.length ?? 0;
    if (holes > 0) {
      currentRound = period.period;
      holesThru = holes;
      if (holes >= 18) completedRounds++;
    }
  }

  if (completedRounds >= totalRoundsInEvent) {
    return { holesThru: 18, currentRound, status: "finished", teeTime: null };
  }

  if (holesThru === 18) {
    // Finished a round — next round's tee time lives in the next period
    const nextPeriod = periods.find((p) => p.period === currentRound + 1);
    const teeTime = extractTeeTime(nextPeriod);
    return { holesThru: 18, currentRound, status: "round-done", teeTime };
  }

  if (holesThru === 0) {
    // Hasn't teed off — find the first period without completed holes
    const upcomingRound = currentRound === 0 ? 1 : currentRound;
    const pendingPeriod = periods.find((p) => p.period === upcomingRound);
    const teeTime = extractTeeTime(pendingPeriod);
    return { holesThru: 0, currentRound: upcomingRound, status: "pre", teeTime };
  }

  return { holesThru, currentRound, status: "live", teeTime: null };
}

function extractTeeTime(period) {
  if (!period) return null;
  const stats = period.statistics?.categories?.[0]?.stats ?? [];
  // Tee time is the last stat entry — it's the only one with just displayValue, no value
  const teeStat = stats.find((s) => s.value === undefined && s.displayValue);
  return teeStat?.displayValue ?? null;
}

function buildScoreMap(espnData) {
  const event = espnData?.events?.[0];
  const competitors = event?.competitions?.[0]?.competitors ?? [];
  // Some events have 2 rounds (pro-ams), most have 4. Try to detect.
  const totalRounds = event?.competitions?.[0]?.totalRounds ?? 4;

  console.log(`[ESPN] Found ${competitors.length} competitors`);

  const map = new Map();

  competitors.forEach((c) => {
    const shortName = c.athlete?.shortName;
    const raw = c.score ?? "E";
    const score = raw === "E" ? 0 : parseInt(raw, 10);
    const { holesThru, currentRound, status, teeTime } = getGolferStatus(c, totalRounds);

    if (shortName) {
      const key = normalizeName(shortName);
      map.set(key, { score, holesThru, currentRound, status, teeTime });
      console.log(
        `[ESPN] "${shortName}" → score=${score}, R${currentRound} thru ${holesThru} (${status})`
      );
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
      const live = scoreMap.get(key);

      if (live) {
        return {
          ...g,
          totalScore: live.score,
          holesThru: live.holesThru,
          currentRound: live.currentRound,
          status: live.status,
          teeTime: live.teeTime,
        };
      } else {
        console.warn(`[No match] "${g.golferName}" (key="${key}")`);
        return g;
      }
    });

    const byBucket = updated.reduce((acc, g) => {
      if (!acc[g.bucketId]) acc[g.bucketId] = [];
      acc[g.bucketId].push(g);
      return acc;
    }, {});

    try {
      await Promise.all(
        Object.entries(byBucket).map(async ([bucketId, golferGroup]) => {
          const payload = golferGroup.map(({ bucketId, ...rest }) => rest);
          const url = `${BUCKET_GOLFERS_URL}/${bucketId}`;

          const res = await fetch(url, {
            method: "PUT",
            headers: COMMON_HEADERS,
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Bucket PUT failed for ${bucketId}: ${res.status} ${text}`);
          }
        })
      );
      console.log("[Sync] Bucket updated successfully");
    } catch (putErr) {
      console.warn("[Sync] Bucket update failed, returning live scores to UI:", putErr.message);
    }

    return updated;
  } catch (err) {
    console.warn("Live score sync failed, falling back to bucket data:", err.message);
    return getAllGolfers();
  }
}