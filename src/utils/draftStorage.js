// Functions used to access/edit bb-drafts data

import { getTeamsForLeague } from "./leagueAndTeamStorage";

const BUCKET_DRAFTS_URL =
  "https://cs571api.cs.wisc.edu/rest/f25/bucket/bb-drafts";

const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "X-CS571-ID":
    "bid_43173fda9267d4ebd9d6283b9e05aa9526dade986fa45ba6c57332cdbdb92315",
};

// ---------- helpers to read bucket shape ----------

async function getAllDrafts() {
  const res = await fetch(BUCKET_DRAFTS_URL, {
    method: "GET",
    headers: COMMON_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Failed to load drafts from Bucket.");
  }

  const data = await res.json();
  const results = data.results || {};

  return Object.entries(results).map(([bucketId, draft]) => ({
    ...draft,
    bucketId,
  }));
}

export async function getDraftForLeague(leagueId) {
  const drafts = await getAllDrafts();
  // assume at most one draft per league
  return drafts.find((d) => d.leagueId === leagueId) || null;
}

// ---------- create draft for league ----------

export async function createDraftForLeague(leagueId) {
  // We need teams to build teamOrder and first picker
  const teams = await getTeamsForLeague(leagueId);
  if (!teams || teams.length === 0) {
    throw new Error("Cannot start a draft with no teams in the league.");
  }

  const numberOfTeams = teams.length;

  // randomize team order (by teamId)
  const teamOrder = [...teams].map((t) => t.teamId);
  for (let i = teamOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teamOrder[i], teamOrder[j]] = [teamOrder[j], teamOrder[i]];
  }

  const picksPerTeam = 6;
  const currentPickNumber = 1;

  // who is on the clock for pick 1?
  const { teamIndex } = computeSnakeSlot(
    currentPickNumber,
    numberOfTeams
  );
  const firstTeamId = teamOrder[teamIndex];
  const firstTeam = teams.find((t) => t.teamId === firstTeamId);
  const currentUserIdPicking = firstTeam?.userId ?? null;

  const now = new Date().toISOString();

  const newDraft = {
    draftId: crypto.randomUUID(),
    leagueId,
    numberOfTeams,
    teamOrder,
    picksPerTeam,
    inProgress: true,
    currentPickNumber,
    currentUserIdPicking,
    picks: [],
    createdAt: now,
    updatedAt: now,
  };

  const res = await fetch(BUCKET_DRAFTS_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(newDraft),
  });

  if (!res.ok) {
    throw new Error("Failed to create draft in Bucket.");
  }

  const data = await res.json();
  return { ...newDraft, bucketId: data.id ?? undefined };
}

// ---------- snake math helpers ----------

// Given overallPickNumber (1-based) and numberOfTeams
// figure out who should pick (teamIndex) and round/pickInRound.
export function computeSnakeSlot(overallPick, numberOfTeams) {
  const pickIndex = overallPick - 1; // 0-based
  const round = Math.floor(pickIndex / numberOfTeams) + 1;
  const pickInRound = (pickIndex % numberOfTeams) + 1;

  let teamIndex;
  if (round % 2 === 1) {
    // odd round: 1..N
    teamIndex = pickInRound - 1;
  } else {
    // even round: N..1
    teamIndex = numberOfTeams - pickInRound;
  }

  return { round, pickInRound, teamIndex };
}

// ---------- update draft on pick ----------

async function putDraftToBucket(draft) {
  const { bucketId, ...body } = draft;
  if (!bucketId) {
    throw new Error("Draft missing bucketId; cannot update.");
  }

  const res = await fetch(
    `${BUCKET_DRAFTS_URL}?id=${encodeURIComponent(bucketId)}`,
    {
      method: "PUT",
      headers: COMMON_HEADERS,
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update draft in Bucket.");
  }

  const data = await res.json();
  return { ...draft, ...data };
}

/**
 * Make a pick for the given golfer in this draft.
 * - Only updates in-memory draft; caller must have already
 *   validated that user is allowed to pick.
 * - Then we PUT the updated draft back to Bucket.
 */
export async function makePickOnDraft({ draft, golfer, teams }) {
  if (!draft.inProgress) {
    throw new Error("Draft is not in progress.");
  }

  const numberOfTeams = draft.numberOfTeams;
  const picksPerTeam = draft.picksPerTeam ?? 6;
  const totalPicks = numberOfTeams * picksPerTeam;

  const currentPick = draft.currentPickNumber;

  // If already at/after last pick, stop.
  if (currentPick > totalPicks) {
    throw new Error("Draft is already complete.");
  }

  const { round, pickInRound, teamIndex } = computeSnakeSlot(
    currentPick,
    numberOfTeams
  );
  const teamId = draft.teamOrder[teamIndex];

  const newPick = {
    overallPick: currentPick,
    round,
    pickInRound,
    teamId,
    golferId: golfer.golferId,
    golferName: golfer.golferName,
    golferCountry: golfer.country,
    timestamp: new Date().toISOString(),
  };

  const newPicks = [...(draft.picks || []), newPick];

  // Move to next pick
  const nextPickNumber = currentPick + 1;

  let inProgress = true;
  let currentUserIdPicking = null;

  if (nextPickNumber > totalPicks) {
    // draft done
    inProgress = false;
  } else {
    const nextSlot = computeSnakeSlot(nextPickNumber, numberOfTeams);
    const nextTeamId = draft.teamOrder[nextSlot.teamIndex];
    const nextTeam = teams.find((t) => t.teamId === nextTeamId);
    currentUserIdPicking = nextTeam?.userId ?? null;
  }

  const updatedDraft = {
    ...draft,
    picks: newPicks,
    currentPickNumber: nextPickNumber,
    currentUserIdPicking,
    inProgress,
    updatedAt: new Date().toISOString(),
  };

  return putDraftToBucket(updatedDraft);
}
