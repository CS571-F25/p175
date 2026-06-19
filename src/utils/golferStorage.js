import { getAllGolfers, BUCKET_GOLFERS_URL, COMMON_HEADERS } from "./golfers";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?tournamentId=401811952";

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

// Parse ESPN per-round displayValue (e.g. "-1", "+4", "E") to an integer relative to par.
function parseRoundScore(displayValue) {
  if (!displayValue || displayValue === "E") return 0;
  return parseInt(displayValue, 10) || 0;
}

/**
 * Given a competitor object from ESPN, return { holesThru, currentRound, status, teeTime }.
 * status: "pre" | "live" | "round-done" | "finished" | "cut"
 *   pre         → hasn't started tournament (or hasn't teed off yet today)
 *   live        → mid-round
 *   round-done  → finished a round but not the tournament (waiting for next round)
 *   finished    → completed all scheduled rounds
 *   cut         → missed the cut
 */
function getGolferStatus(competitor, totalRoundsInEvent = 4) {
  const espnStatusName = competitor.status?.type?.name ?? "";

  // ESPN marks cut golfers with an explicit status — check before linescore logic.
  if (espnStatusName.toUpperCase().includes("CUT")) {
    const periods = competitor.linescores ?? [];
    const lastRound = periods.reduce(
      (max, p) => (typeof p.value === "number" && p.value > 0 ? Math.max(max, p.period) : max),
      2
    );
    return { holesThru: 18, currentRound: lastRound, status: "cut", teeTime: null };
  }

  // Detect withdrawals — find the last round/holes they actually played.
  if (espnStatusName.toUpperCase().includes("WD") || espnStatusName.toUpperCase().includes("WITHDRAWN")) {
    const periods = competitor.linescores ?? [];
    let lastRound = 1;
    let lastHoles = 0;
    for (const period of periods) {
      const holes = period.linescores?.length ?? 0;
      if (holes > 0) {
        lastRound = period.period;
        lastHoles = holes;
      }
    }
    return { holesThru: lastHoles, currentRound: lastRound, status: "wd", teeTime: null };
  }

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

function computeWDPenalty(penaltyFromRound, r1Penalty, r2Penalty, r3Penalty, r4Penalty) {
  const all = [r1Penalty, r2Penalty, r3Penalty, r4Penalty];
  let total = 0;
  for (let r = penaltyFromRound; r <= 4; r++) total += all[r - 1];
  return total;
}

function buildScoreMap(espnData) {
  const event = espnData?.events?.[0];
  const competitors = event?.competitions?.[0]?.competitors ?? [];
  const totalRounds = event?.competitions?.[0]?.totalRounds ?? 4;

  console.log(`[ESPN] Found ${competitors.length} competitors`);

  // First pass — gather all competitor data and per-round scores.
  const allData = [];
  let tournamentRound = 1;

  competitors.forEach((c) => {
    const shortName = c.athlete?.shortName;
    if (!shortName) return;

    const raw = c.score ?? "E";
    const score = raw === "E" ? 0 : parseInt(raw, 10);
    const statusInfo = getGolferStatus(c, totalRounds);

    const roundScores = {};
    (c.linescores ?? []).forEach((p) => {
      if (p.displayValue && p.period >= 1 && p.period <= 4) {
        roundScores[p.period] = parseRoundScore(p.displayValue);
      }
    });

    if (statusInfo.currentRound > tournamentRound) {
      tournamentRound = statusInfo.currentRound;
    }

    allData.push({ shortName, score, roundScores, ...statusInfo });
  });

  // Derive the cut line once R3 is underway.
  // The worst 36-hole score among golfers actively playing R3+ is the cut line.
  // Any R2 round-done golfer with a strictly higher score missed the cut.
  if (tournamentRound >= 3) {
    const inR3 = allData.filter((d) => d.currentRound >= 3);
    if (inR3.length > 0) {
      const r2Totals = inR3.map(
        (d) => d.score - (d.roundScores[3] ?? 0) - (d.roundScores[4] ?? 0)
      );
      const cutLine = Math.max(...r2Totals);

      allData.forEach((entry) => {
        if (
          entry.status === "round-done" &&
          entry.currentRound <= 2 &&
          entry.score > cutLine
        ) {
          entry.status = "cut";
        }
      });

      const cutCount = allData.filter((d) => d.status === "cut").length;
      console.log(
        `[Cut] Derived cut line: ${cutLine >= 0 ? "+" : ""}${cutLine}. ${cutCount} golfers marked cut.`
      );
    }
  }

  // Compute worst non-cut, non-WD round scores for round penalties.
  const eligible = allData.filter((d) => d.status !== "cut" && d.status !== "wd");
  const r1Scores = eligible.filter((d) => d.roundScores[1] !== undefined).map((d) => d.roundScores[1]);
  const r2Scores = eligible.filter((d) => d.roundScores[2] !== undefined).map((d) => d.roundScores[2]);
  const r3Scores = eligible.filter((d) => d.roundScores[3] !== undefined).map((d) => d.roundScores[3]);
  const r4Scores = eligible.filter((d) => d.roundScores[4] !== undefined).map((d) => d.roundScores[4]);

  const r1Penalty = r1Scores.length > 0 ? Math.min(10, Math.max(...r1Scores)) : 0;
  const r2Penalty = r2Scores.length > 0 ? Math.min(10, Math.max(...r2Scores)) : 0;
  const r3Penalty = r3Scores.length > 0 ? Math.min(10, Math.max(...r3Scores)) : 0;
  const r4Penalty = r4Scores.length > 0 ? Math.min(10, Math.max(...r4Scores)) : 0;

  // Build the score map, applying cut/WD penalties.
  const map = new Map();
  allData.forEach(({ shortName, score, roundScores, holesThru, currentRound, status, teeTime }) => {
    const key = normalizeName(shortName);
    let finalScore = score;
    let wdPenaltyFromRound = null;
    if (status === "cut") {
      finalScore = score + r3Penalty + r4Penalty;
    } else if (status === "wd") {
      // Keep any partial score as their base; only penalize rounds they missed entirely.
      // If holesThru > 0 they played (partial or full) that round — penalty starts next round.
      // If holesThru === 0 they never teed off — penalty starts from currentRound.
      const penaltyFrom = holesThru > 0 ? currentRound + 1 : currentRound;
      wdPenaltyFromRound = penaltyFrom;
      finalScore = score + computeWDPenalty(penaltyFrom, r1Penalty, r2Penalty, r3Penalty, r4Penalty);
    }
    map.set(key, { score: finalScore, holesThru, currentRound, status, teeTime, roundScores, wdPenaltyFromRound });
    console.log(
      `[ESPN] "${shortName}" → score=${finalScore}, R${currentRound} thru ${holesThru} (${status})`
    );
  });

  return { map, tournamentRound, r1Penalty, r2Penalty, r3Penalty, r4Penalty };
}

export async function getTournamentName() {
  try {
    const res = await fetch(ESPN_SCOREBOARD_URL);
    if (!res.ok) return "Tournament";
    const data = await res.json();
    return data?.events?.[0]?.name ?? "Tournament";
  } catch {
    return "Tournament";
  }
}

export async function syncLiveScoresToBucket() {
  try {
    const espnRes = await fetch(ESPN_SCOREBOARD_URL);
    if (!espnRes.ok) throw new Error(`ESPN fetch failed: ${espnRes.status}`);

    const espnData = await espnRes.json();
    const { map: scoreMap, tournamentRound, r1Penalty, r2Penalty, r3Penalty, r4Penalty } = buildScoreMap(espnData);
    const totalCutPenalty = r3Penalty + r4Penalty;

    const golfers = await getAllGolfers();
    console.log(`[Bucket] Found ${golfers.length} golfers`);

    // Log any ESPN golfers not found in the bucket
    const bucketKeys = new Set(golfers.map((g) => normalizeName(g.golferName)));
    scoreMap.forEach((_, espnKey) => {
      if (!bucketKeys.has(espnKey)) {
        console.warn(`[Missing from bucket] ESPN key: "${espnKey}"`);
      }
    });

    const updated = golfers.map((g) => {
      const key = normalizeName(g.golferName);
      const live = scoreMap.get(key);

      if (live) {
        // If ESPN still shows the golfer as live in a previous round, the tournament passed
        // them by — they withdrew mid-round and ESPN just froze their state.
        if (live.status === "live" && live.currentRound < tournamentRound) {
          const wdBase = live.score;
          const holesPlayed = live.holesThru ?? 0;
          const wdRound = live.currentRound ?? 1;
          const penaltyFrom = holesPlayed > 0 ? wdRound + 1 : wdRound;
          const wdPenalty = computeWDPenalty(penaltyFrom, r1Penalty, r2Penalty, r3Penalty, r4Penalty);
          console.warn(`[WD] "${g.golferName}" → frozen live R${wdRound} thru ${holesPlayed}, tournament=R${tournamentRound}, penalty=+${wdPenalty}`);
          return {
            ...g,
            status: "wd",
            totalScore: wdBase + wdPenalty,
            wdBaseScore: wdBase,
            wdPenaltyFromRound: penaltyFrom,
            holesThru: live.holesThru,
            currentRound: live.currentRound,
            teeTime: null,
            roundScores: live.roundScores ?? {},
          };
        }

        // ESPN provided this golfer's data (including ESPN-reported cut golfers).
        const update = {
          ...g,
          totalScore: live.score,
          holesThru: live.holesThru,
          currentRound: live.currentRound,
          status: live.status,
          teeTime: live.teeTime,
          roundScores: live.roundScores ?? {},
        };
        if (live.status === "cut") {
          // Store the pre-penalty base score so future syncs can recalculate correctly.
          update.cutBaseScore = live.score - totalCutPenalty;
        }
        if (live.status === "wd") {
          const penaltyFrom = live.wdPenaltyFromRound ?? 1;
          const wdPenalty = computeWDPenalty(penaltyFrom, r1Penalty, r2Penalty, r3Penalty, r4Penalty);
          update.wdBaseScore = live.score - wdPenalty;
          update.wdPenaltyFromRound = penaltyFrom;
        }
        return update;
      }

      // Golfer not in ESPN data.
      // If already marked cut, recalculate their penalized score with current round penalties.
      if (g.status === "cut") {
        const cutBase = g.cutBaseScore ?? g.totalScore ?? 0;
        return { ...g, cutBaseScore: cutBase, totalScore: cutBase + totalCutPenalty };
      }

      // If already marked WD, recalculate with updated round penalties.
      if (g.status === "wd") {
        const wdBase = g.wdBaseScore ?? g.totalScore ?? 0;
        const penaltyFrom = g.wdPenaltyFromRound ?? 1;
        const wdPenalty = computeWDPenalty(penaltyFrom, r1Penalty, r2Penalty, r3Penalty, r4Penalty);
        return { ...g, wdBaseScore: wdBase, wdPenaltyFromRound: penaltyFrom, totalScore: wdBase + wdPenalty };
      }

      // If a golfer was mid-round (live) but the tournament has moved past their round,
      // they dropped from the ESPN feed — treat as WD.
      const likelyWD =
        g.status === "live" &&
        (g.currentRound ?? 0) < tournamentRound;

      if (likelyWD) {
        const wdBase = g.totalScore ?? 0;
        const holesPlayed = g.holesThru ?? 0;
        const wdRound = g.currentRound ?? 1;
        // Keep partial score; penalize only the rounds they missed entirely.
        const penaltyFrom = holesPlayed > 0 ? wdRound + 1 : wdRound;
        const wdPenalty = computeWDPenalty(penaltyFrom, r1Penalty, r2Penalty, r3Penalty, r4Penalty);
        console.warn(`[WD] "${g.golferName}" → base=${wdBase}, penaltyFrom=R${penaltyFrom}, penalty=${wdPenalty}`);
        return { ...g, status: "wd", wdBaseScore: wdBase, wdPenaltyFromRound: penaltyFrom, totalScore: wdBase + wdPenalty };
      }

      // If tournament has moved past R2 and this golfer stopped after R2, they missed the cut.
      const likelyCut =
        tournamentRound >= 3 &&
        g.status !== "pre" &&
        g.status !== "wd" &&
        (g.currentRound ?? 0) <= 2;

      if (likelyCut) {
        const cutBase = g.totalScore ?? 0;
        console.warn(`[Cut] "${g.golferName}" → base=${cutBase}, penalty=${totalCutPenalty}`);
        return { ...g, status: "cut", cutBaseScore: cutBase, totalScore: cutBase + totalCutPenalty };
      }

      console.warn(`[No match] "${g.golferName}" (key="${key}")`);
      return g;
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