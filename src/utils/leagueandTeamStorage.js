// Buckets for leagues and teams

import { getUserByUsername, getAllUsers } from "./userStorage";
import { hashPassword } from "./hashPassword";

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

// Helper to finds leagues for user when they login
export async function getLeaguesForUser(userId) {
  const leagues = await getAllLeagues();
  return leagues.filter(l => Array.isArray(l.userIds) && l.userIds.includes(userId));
}

// Add a userId to a league's userIds[] in Bucket
// Add a userId to a league's userIds[] in Bucket
async function addUserToLeagueInBucket(league, userId) {
  const currentUserIds = Array.isArray(league.userIds) ? league.userIds : [];

  // Avoid duplicates
  if (currentUserIds.includes(userId)) {
    return league;
  }

  const updatedLeague = {
    ...league,
    userIds: [...currentUserIds, userId],
  };

  const { bucketId, ...body } = updatedLeague; // strip bucketId before sending

  const res = await fetch(
    `${BUCKET_LEAGUES_URL}?id=${encodeURIComponent(league.bucketId)}`,
    {
      method: "PUT",
      headers: COMMON_HEADERS,
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update league members in Bucket.");
  }

  return updatedLeague;
}

// Find a league by its leagueId
export async function getLeagueById(leagueId) {
  const leagues = await getAllLeagues();
  const league = leagues.find((l) => l.leagueId === leagueId);

  if (!league) {
    throw new Error("League not found.");
  }

  return league;
}

// Get all teams for a given leagueId, with usernames attached
export async function getTeamsForLeague(leagueId) {
  // 1. Fetch all teams from bb-teams
  const res = await fetch(BUCKET_TEAMS_URL, {
    method: "GET",
    headers: COMMON_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Failed to load teams from Bucket.");
  }

  const data = await res.json();
  const results = data.results || {};

  // Flatten bucket shape -> array of teams
  const allTeams = Object.entries(results)
    .filter(([, value]) => value && !Array.isArray(value))
    .map(([bucketId, team]) => ({
      ...team,
      bucketId,
    }));

  // Only keep teams for this league
  const leagueTeams = allTeams.filter((t) => t.leagueId === leagueId);

  // 2. Get all users, build a lookup from userId -> username
  const users = await getAllUsers();
  const userById = new Map(
    users.map((u) => [u.userId || u.id, u])
  );

  // 3. Attach displayName + normalize totalScore
  const withNames = leagueTeams.map((t) => {
    const user = userById.get(t.userId);
    const username = user?.username || "Unknown";

    return {
      ...t,
      id: t.teamId || t.id,
      displayName: username,
      totalScore:
        typeof t.totalScore === "number"
          ? t.totalScore
          : Number(t.totalScore) || 0,
    };
  });

  // 4. Sort by score (lower is better in golf)
  withNames.sort((a, b) => a.totalScore - b.totalScore);

  return withNames;
}

// Create league
export async function createLeague({ leagueName, leaguePassword, ownerUsername }) {
  // 1. Look up the owner
  const owner = await getUserByUsername(ownerUsername);
  if (!owner) {
    throw new Error("Owner user not found.");
  }

  const userId = owner.userId || owner.id;

  // 2. Hash the password before storing it
  const leaguePasswordHash = await hashPassword(leaguePassword);

  // 3. Build the league object
  const newLeague = {
    leagueId: crypto.randomUUID(),
    ownerId: userId,
    leagueName,
    leaguePassword: leaguePasswordHash,
    userIds: [userId],
    createdAt: new Date().toISOString(),
  };

  // 4. Save league to Bucket
  const res = await fetch(BUCKET_LEAGUES_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(newLeague),
  });

  if (!res.ok) {
    throw new Error("Failed to create league in Bucket.");
  }

  const data = await res.json();
  const leagueWithBucket = { ...newLeague, bucketId: data.id ?? undefined };

  // 5. Create a team for the owner in this league
  const team = await createTeamForUserInLeague({
    userId,
    username: owner.username,
    leagueId: newLeague.leagueId,
  });

  // 6. Return both league and team (so UI can use them later if needed)
  return { league: leagueWithBucket, team };
}


// Helper to create a team for a user in a league
async function createTeamForUserInLeague({ userId, username, leagueId }) {
  const newTeam = {
    teamId: crypto.randomUUID(),
    userId,
    username,
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

// Join League
export async function joinLeague({ leagueName, poolPassword, username }) {
  // 1. Find the league by name
  const league = await getLeagueByName(leagueName);
  if (!league) {
    throw new Error("No pool found with that name.");
  }

  // 2. Hash the entered password and compare to stored hash
  const poolPasswordHash = await hashPassword(poolPassword);
  if (league.leaguePassword !== poolPasswordHash) {
    throw new Error("Incorrect pool password.");
  }

  // 3. Look up the user by username
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found. Please log in again.");
  }

  const userId = user.userId || user.id;

  // 4. Create a team for this user in this league
  const team = await createTeamForUserInLeague({
    userId,
    username: user.username,
    leagueId: league.leagueId,
  });

  // 5. Add this userId to league.userIds[] in Bucket
  const updatedLeague = await addUserToLeagueInBucket(league, userId);

  return { league: updatedLeague, team };
}

// Update all teams in a league after a draft completes.
// - draft: the final draft object (with picks[] and leagueId)
// - golfers: full golfer list from bb-golfers (to compute totalScore)
export async function updateTeamsFromCompletedDraft(draft, golfers) {
  if (!draft || !Array.isArray(draft.picks) || !draft.leagueId) {
    return;
  }

  // Map golferId -> golfer (for totalScore lookup)
  const golferById = new Map(
    (golfers || []).map((g) => [g.golferId, g])
  );

  // Aggregate golfers + totalScore per teamId
  const teamAgg = new Map();
  for (const p of draft.picks) {
    if (!p.teamId || !p.golferId) continue;

    const agg =
      teamAgg.get(p.teamId) || { golferIds: [], totalScore: 0 };

    if (!agg.golferIds.includes(p.golferId)) {
      agg.golferIds.push(p.golferId);

      const g = golferById.get(p.golferId);
      if (g && typeof g.totalScore === "number") {
        agg.totalScore += g.totalScore;
      }
    }

    teamAgg.set(p.teamId, agg);
  }

  if (!teamAgg.size) return;

  // Load current teams so we have bucketId, etc.
  const teams = await getTeamsForLeague(draft.leagueId);

  // Write each updated team back to bb-teams
  await Promise.all(
    teams.map(async (team) => {
      const tid = team.teamId || team.id;
      const agg = teamAgg.get(tid);
      if (!agg) return; // this team never picked (we just leave it)

      const updatedTeam = {
        ...team,
        golferIds: agg.golferIds,
        totalScore: agg.totalScore,
      };

      const { bucketId, ...body } = updatedTeam;

      const res = await fetch(
        `${BUCKET_TEAMS_URL}?id=${encodeURIComponent(bucketId)}`,
        {
          method: "PUT",
          headers: COMMON_HEADERS,
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update teams from completed draft.");
      }
    })
  );
}
