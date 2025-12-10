// Users Bucket

import { hashPassword } from "./hashPassword";

const BUCKET_USERS_URL = "https://cs571api.cs.wisc.edu/rest/f25/bucket/bb-users";

// Required header for Bucket API
const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "X-CS571-ID": "bid_43173fda9267d4ebd9d6283b9e05aa9526dade986fa45ba6c57332cdbdb92315",
};

// Fetch all users from the Bucket and flatten them to an array
export async function getAllUsers() {
  const res = await fetch(BUCKET_USERS_URL, {
    method: "GET",
    headers: COMMON_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Failed to load users from Bucket.");
  }

  const data = await res.json();
  const results = data.results || {};

  const users = [];

  for (const [bucketKey, value] of Object.entries(results)) {
    if (Array.isArray(value)) {
      for (const u of value) {
        users.push({
          ...u,
          _bucketKey: bucketKey,
        });
      }
    } else if (value && typeof value === "object") {
      users.push({
        ...value,
        _bucketKey: bucketKey,
      });
    }
  }

  return users;
}

// Check for username availability
export async function getUserByUsername(username) {
  const users = await getAllUsers();
  return users.find(
    (u) => u.username?.toLowerCase() === username.toLowerCase()
  );
}

// Create a new user record in the Bucket
export async function createUser({ username, password }) {
  // 1) Enforce unique username
  const exists = await getUserByUsername(username);
  if (exists) {
    throw new Error("That username already exists.");
  }

  // 2) Hash the password
  const passwordHash = await hashPassword(password);

  // 3) Build the user object we want to store
  const newUser = {
    userId: crypto.randomUUID(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
    leagueIds: [],
    teamIds: [],
  };

  // 4) POST it to the Bucket (creates one new record under results)
  const res = await fetch(BUCKET_USERS_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(newUser),
  });

  if (!res.ok) {
    throw new Error("Failed to save user to Bucket.");
  }

  // You can inspect the response if you want the bucket key:
  // const saved = await res.json();
  // But for now we just return our newUser object.
  return newUser;
}

// Authenticate username + password against bucket
export async function authenticateUser(username, password) {
  const users = await getAllUsers();

  const user = users.find(
    (u) => u.username?.toLowerCase() === username.toLowerCase()
  );
  if (!user) {
    throw new Error("No account found with that username.");
  }

  const suppliedHash = await hashPassword(password);

  if (suppliedHash !== user.passwordHash) {
    throw new Error("Incorrect password.");
  }

  return user; // has id, username, leagueIds, teamIds, etc.
}

// To add leagueIds to bb-user
export async function addLeagueAndTeamToUser({ userId, leagueId, teamId }) {
  const res = await fetch(BUCKET_USERS_URL, {
    method: "GET",
    headers: COMMON_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Failed to load users from Bucket.");
  }

  const data = await res.json();
  const results = data.results || {};

  let bucketId = null;
  let userDoc = null;

  for (const [id, value] of Object.entries(results)) {
    if (value && value.userId === userId) {
      bucketId = id;
      userDoc = value;
      break;
    }
  }

  if (!userDoc || !bucketId) {
    throw new Error("User not found in Bucket.");
  }

  const existingLeagueIds = Array.isArray(userDoc.leagueIds)
    ? userDoc.leagueIds
    : [];
  const existingTeamIds = Array.isArray(userDoc.teamIds)
    ? userDoc.teamIds
    : [];

  const updatedUser = {
    ...userDoc,
    leagueIds: existingLeagueIds.includes(leagueId)
      ? existingLeagueIds
      : [...existingLeagueIds, leagueId],
    teamIds:
      teamId && !existingTeamIds.includes(teamId)
        ? [...existingTeamIds, teamId]
        : existingTeamIds,
  };

  const putRes = await fetch(
    `${BUCKET_USERS_URL}?id=${encodeURIComponent(bucketId)}`,
    {
      method: "PUT",
      headers: COMMON_HEADERS,
      body: JSON.stringify(updatedUser),
    }
  );

  if (!putRes.ok) {
    throw new Error("Failed to update user with league/team.");
  }

  return updatedUser;
}

