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

// Helper: normalize Bucket -> array of drafts with bucketId
async function fetchAllDrafts() {
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

/**
 * Get the most recent draft for a league (if any).
 * Right now we:
 *   - filter by leagueId
 *   - if multiple, choose the one with the latest createdAt
 */
export async function getDraftForLeague(leagueId) {
  const res = await fetch(`${BUCKET_DRAFTS_URL}?leagueId=${encodeURIComponent(leagueId)}`, {
    method: "GET",
    headers: COMMON_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch draft.");
  }

  const data = await res.json();
  const results = data.results || {};

  // assuming 0 or 1 draft per league; grab the first
  const first = Object.entries(results)[0];
  if (!first) return null;

  const [bucketId, draft] = first;
  return { ...draft, bucketId };
}

// For randomizing draft order
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Create a new draft for the league.
 * teamOrder should be an array of teamIds in pick order (snake order setup).
 */
export async function createDraftForLeague(leagueId) {
  // 1. Load teams for this league
  const teams = await getTeamsForLeague(leagueId);
  const teamIds = teams.map((t) => t.teamId || t.id);

  // 2. Randomize order ONCE
  const teamOrder = shuffleArray(teamIds);

  const now = new Date().toISOString();

  const draftBody = {
    draftId: crypto.randomUUID(),
    leagueId,
    numberOfTeams: teamOrder.length,
    inProgress: true,
    teamOrder, // randomized
    currentPickNumber: 1,
    currentUserIdPicking: null, // you can fill this in later using team->user mapping
    picks: [],
    createdAt: now,
    updatedAt: now,
  };

  const res = await fetch(BUCKET_DRAFTS_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(draftBody),
  });

  if (!res.ok) {
    throw new Error("Failed to create draft in Bucket.");
  }

  const data = await res.json();
  return { ...draftBody, bucketId: data.id ?? undefined };
}

/**
 * (For later) generic updater – same ?id pattern as leagues.
 */
export async function updateDraftInBucket(draft) {
  if (!draft.bucketId) {
    throw new Error("Draft is missing bucketId; cannot PUT.");
  }

  const { bucketId, ...body } = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };

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

  return { ...body, bucketId };
}