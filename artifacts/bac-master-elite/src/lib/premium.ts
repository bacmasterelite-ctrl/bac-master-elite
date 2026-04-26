import { useCallback, useEffect, useState } from "react";

/** Free tier limits */
export const FREE_AI_DAILY_LIMIT = 3;

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const storageKey = (userId: string | undefined) =>
  `bme:tuteur-ia:${userId ?? "anon"}:${todayKey()}`;

/**
 * Track daily AI message count for a user (free-tier limit enforcement).
 * Stored in localStorage keyed per user + per day, so it auto-resets at midnight.
 */
export function useDailyAILimit(userId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      setCount(raw ? Number(raw) || 0 : 0);
    } catch {
      setCount(0);
    }
  }, [userId]);

  const increment = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem(storageKey(userId), String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [userId]);

  const remaining = Math.max(0, FREE_AI_DAILY_LIMIT - count);
  const reached = count >= FREE_AI_DAILY_LIMIT;

  return { count, remaining, reached, increment };
}
