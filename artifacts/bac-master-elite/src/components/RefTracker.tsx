import { useEffect } from "react";
import { registerReferralClick } from "@/lib/extensions";

/**
 * Mounts globally; if the URL contains ?ref=CODE, register the click
 * (increments invitations.clicks and awards +10 points to the inviter).
 * Idempotent per browser via localStorage.
 */
export default function RefTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;
    void registerReferralClick(code).catch(() => {
      /* swallow; silent fail is fine for a tracking ping */
    });
  }, []);
  return null;
}
