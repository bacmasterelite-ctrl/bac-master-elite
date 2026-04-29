import { useMemo } from "react";
import { useProfile, usePremiumStatus } from "./queries";

/** Free tier limits */
export const FREE_AI_DAILY_LIMIT = 3;

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Daily AI quota for free users — backed by Supabase columns
 * `profiles.free_bot_questions_today` and `profiles.last_activity_date`.
 *
 * Returns the same shape as before:
 *   { count, remaining, reached, increment }
 *
 * `increment` is provided by the caller (via useIncrementAIQuestion mutation),
 * so this hook only computes display state from the live profile.
 */
export function useDailyAILimit(userId: string | undefined) {
  const { data: profile } = useProfile(userId);
  const { isPremium } = usePremiumStatus(userId);

  return useMemo(() => {
    if (isPremium) {
      return {
        count: 0,
        remaining: Infinity,
        reached: false,
        unlimited: true as const,
      };
    }
    const today = todayISO();
    const sameDay = profile?.last_activity_date === today;
    const count = sameDay ? profile?.free_bot_questions_today ?? 0 : 0;
    const remaining = Math.max(0, FREE_AI_DAILY_LIMIT - count);
    const reached = count >= FREE_AI_DAILY_LIMIT;
    return { count, remaining, reached, unlimited: false as const };
  }, [profile?.free_bot_questions_today, profile?.last_activity_date, isPremium]);
}
