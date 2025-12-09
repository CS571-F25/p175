// Buckets for leagues and teams

import { getUserByUsername } from "./userStorage";

const BUCKET_LEAGUES_URL = "https://cs571api.cs.wisc.edu/rest/f25/bucket/bb-leagues";
const BUCKET_TEAMS_URL   = "https://cs571api.cs.wisc.edu/rest/f25/bucket/bb-teams";

const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "X-CS571-ID": "bid_43173fda9267d4ebd9d6283b9e05aa9526dade986fa45ba6c57332cdbdb92315",
};

// --- Helpers for Bucket shape ---

// Get all leagues as a flat array
export async function getAllLeagues() {
  const res = await fetch(BUCKET_LEAGUES_URL, {
    method: "GET",
    headers: COMMON_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Failed to load leagues from Bucket.");
  }

  const data = await res.json();
  const results = data.results || {};

  return Object.entries(results)
    .filter(([, value]) => value && !Array.isArray(value))
    .map(([bucketId, league]) => ({
      ...league,
      bucketId, // internal bucket document id (useful later if you want to update)
    }));
}

// Find a league by name (case insensitive)
export async function getLeagueByName(leagueName) {
  const leagues = await getAllLeagues();
  return leagues.find(
    (l) => l.leagueName?.toLowerCase() === leagueName.toLowerCase()
  );
}

// Create league
export async function createLeague({ leagueName, leaguePassword, ownerUsername }) {
  const owner = await getUserByUsername(ownerUsername);
  if (!owner) {
    throw new Error("Owner user not found.");
  }

  const newLeague = {
    leagueId: crypto.randomUUID(),
    ownerId: owner.userId || owner.id,
    leagueName,
    leaguePassword,
    userIds: [owner.userId || owner.id],
    createdAt: new Date().toISOString(),
  };

  const res = await fetch(BUCKET_LEAGUES_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(newLeague),
  });

  if (!res.ok) {
    throw new Error("Failed to create league in Bucket.");
  }

  const data = await res.json(); // Bucket usually echoes back an object, possibly with an id
  return { ...newLeague, bucketId: data.id ?? undefined };
}

// Helper to create a team for a user in a league
async function createTeamForUserInLeague({ userId, leagueId }) {
  const newTeam = {
    teamId: crypto.randomUUID(),
    userId,
    leagueId,
    golferIds: [],
    totalScore: 0,
  };

  const res = await fetch(BUCKET_TEAMS_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(newTeam),
  });

  if (!res.ok) {
    throw new Error("Failed to create team in Bucket.");
  }

  const data = await res.json();
  return { ...newTeam, bucketId: data.id ?? undefined };
}

// --- Main: Join league ---

export async function joinLeague({ leagueName, poolPassword, username }) {
  // 1. Find the league by name
  const league = await getLeagueByName(leagueName);
  if (!league) {
    throw new Error("No pool found with that name.");
  }

  // 2. Check password
  if (league.leaguePassword !== poolPassword) {
    throw new Error("Incorrect pool password.");
  }

  // 3. Look up the user by username
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found. Please log in again.");
  }

  const userId = user.userId || user.id;

  // 4. (Optional) In a full version, you'd check if this user already has a team
  // in this league to prevent duplicates. We'll skip that for now.

  // 5. Create a team for this user in this league
  const team = await createTeamForUserInLeague({
    userId,
    leagueId: league.leagueId,
  });

  // 6. You *could* also update league.userIds and user.leagueIds/teamIds here
  // via PUT calls to Bucket. You said you're okay skipping that for now.

  return { league, team };
}
