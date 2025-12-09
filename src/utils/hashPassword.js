// Hash and add salt to password


const SALT = "birdieboard_v1_salt";

// Hash a password using SHA-256 + a static salt.
// Returns a hex string.
export async function hashPassword(password) {
  // Append salt to the raw password
  const saltedPassword = password + SALT;

  // Convert string to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(saltedPassword);

  // Compute SHA-256 digest
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert ArrayBuffer → byte array → hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}
