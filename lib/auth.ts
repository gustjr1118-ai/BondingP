const encoder = new TextEncoder();
export const AUTH_COOKIE = "prompt_six_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function passwordsMatch(received: string, expected: string) {
  return constantTimeEqual(await sha256(received), await sha256(expected));
}

export async function createSession(secret: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `${expiresAt}.${await hmac(String(expiresAt), secret)}`;
}

export async function verifySession(value: string | undefined, secret: string | undefined) {
  if (!value || !secret) return false;
  const [expiresAtText, signature] = value.split(".");
  if (!expiresAtText || !signature || Number(expiresAtText) <= Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(expiresAtText, secret);
  return constantTimeEqual(encoder.encode(signature), encoder.encode(expected));
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_SECONDS,
};
