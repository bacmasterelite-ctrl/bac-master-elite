import { useEffect } from "react";

const REF_KEY = "bme:ref";
const REF_TS_KEY = "bme:ref:ts";
const REF_TTL_MS = 30 * 24 * 3600 * 1000; // 30 days
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Captures `?ref=<user_id>` from the URL and stores it in localStorage so
 * it can be read at signup time. Anything that isn't a valid UUID is ignored.
 * The reference expires after 30 days.
 */
export default function RefTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref || !UUID_RE.test(ref)) return;
    try {
      window.localStorage.setItem(REF_KEY, ref);
      window.localStorage.setItem(REF_TS_KEY, String(Date.now()));
    } catch {
      /* private mode or storage full — silent */
    }
  }, []);
  return null;
}

/** Reads the stored referrer user id, or null if absent / expired / invalid. */
export function readStoredReferrer(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const ref = window.localStorage.getItem(REF_KEY);
    const ts = Number(window.localStorage.getItem(REF_TS_KEY) ?? 0);
    if (!ref || !UUID_RE.test(ref)) return null;
    if (ts && Date.now() - ts > REF_TTL_MS) {
      window.localStorage.removeItem(REF_KEY);
      window.localStorage.removeItem(REF_TS_KEY);
      return null;
    }
    return ref;
  } catch {
    return null;
  }
}

export function clearStoredReferrer() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REF_KEY);
    window.localStorage.removeItem(REF_TS_KEY);
  } catch {
    /* ignore */
  }
}
