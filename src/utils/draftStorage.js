// Drafts bucket

import { getTeamsForLeague } from "./leagueAndTeamStorage";

const BUCKET_DRAFTS_URL =
  "https://cs571api.cs.wisc.edu/rest/f25/bucket/bb-drafts";

const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "X-CS571-ID":
    "bid_43173fda9267d4ebd9d6283b9e05aa9526dade986fa45ba6c57332cdbdb92315",
};

// --- helpers to read drafts ---

// Get ALL drafts, flattened into an array
export async function getAllDrafts() {
  const res = await fetch(BUCKET_DRAFTS_URL, {
    method: "GET",
    headers: COMMON_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Failed to load drafts from Bucket.");
  }

  const data = await res.json();
  const results = data.results || {};

  return Object.entries(results)
    .filter(([, value]) => value && !Array.isArray(value))
    .map(([bucketId, draft]) => ({
      ...draft,
      bucketId, // the bucket document ID
    }));
}

// Get the (latest) draft for a specific league, if any
export async function getDraftForLeague(leagueId) {
  const drafts = await getAllDrafts();
  // For now, just pick the most recent one for that league
  const forLeague = drafts.filter((d) => d.leagueId === leagueId);

  if (forLeague.length === 0) {
    return null;
  }

  // sort by createdAt descending
  forLeague.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return forLeague[0];
}

// --- creating a new draft ---

// Randomly shuffle an array (naive but fine for this app)
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Create a new draft for a league.
 * - Fetches teams for the league
 * - Randomizes teamOrder
 * - Starts at pick #1 for the first team
 * - Saves to bb-drafts via POST
 */
export async function createDraftForLeague(leagueId) {
  // 1. Load teams for this league
  const teams = await getTeamsForLeague(leagueId);

  if (!Array.isArray(teams) || teams.length === 0) {
    throw new Error("Cannot start a draft with no teams in the league.");
  }

  const teamIds = teams.map((t) => t.teamId);
  const numberOfTeams = teamIds.length;

  // 2. Randomize draft order
  const teamOrder = shuffleArray(teamIds);

  // 3. Determine who picks first
  const firstTeamId = teamOrder[0];
  const firstTeam = teams.find((t) => t.teamId === firstTeamId);

  const nowIso = new Date().toISOString();

  const newDraft = {
    draftId: crypto.randomUUID(),
    leagueId,
    numberOfTeams,

    inProgress: true,

    teamOrder, // array of teamIds in randomized order

    currentPickNumber: 1,
    currentUserIdPicking: firstTeam ? firstTeam.userId : null,

    picks: [],

    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // 4. POST to bb-drafts
  const res = await fetch(BUCKET_DRAFTS_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(newDraft),
  });

  if (!res.ok) {
    throw new Error("Failed to create draft in Bucket.");
  }

  const data = await res.json();

  return {
    ...newDraft,
    bucketId: data.id ?? undefined,
  };
}
