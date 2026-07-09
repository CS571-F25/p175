// Functions used to access/edit bb-golfers data

export const BUCKET_GOLFERS_URL =
  "https://cs571api.cs.wisc.edu/rest/f25/bucket/bb-golfers";

export const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "X-CS571-ID":
    "bid_43173fda9267d4ebd9d6283b9e05aa9526dade986fa45ba6c57332cdbdb92315",
};

const ACTIVE_TOURNAMENT_ID = "401811955";

/**
 * Fetch all golfers from the bb-golfers bucket, filtered to the active tournament.
 */
export async function getAllGolfers() {
  const res = await fetch(BUCKET_GOLFERS_URL, {
    method: "GET",
    headers: COMMON_HEADERS,
  });

  if (!res.ok) {
    throw new Error("Failed to load golfers from Bucket.");
  }

  const data = await res.json();
  const results = data.results || {};

  const golfers = [];

  Object.entries(results).forEach(([bucketId, value]) => {
    if (Array.isArray(value)) {
      value.forEach((g) => golfers.push({ ...g, bucketId }));
    } else if (value && typeof value === "object") {
      golfers.push({ ...value, bucketId });
    }
  });

  return golfers.filter((g) => g.tournamentId === ACTIVE_TOURNAMENT_ID);
}
