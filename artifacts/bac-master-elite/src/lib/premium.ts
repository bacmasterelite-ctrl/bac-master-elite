import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { usePremiumStatus } from "./queries";

/** Free tier limits */
export const FREE_AI_DAILY_LIMIT = 3;

/**
 * Daily AI quota — lit chat_count depuis daily_usage pour aujourd'hui.
 */
export function useDailyAILimit(userId: string | undefined) {
  const { isPremium } = usePremiumStatus(userId);

  const { data } = useQuery({
    queryKey: ["daily_usage_bot", userId],
    queryFn: async () => {
      if (!userId) return null;
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("daily_usage")
        .select("chat_count")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!userId && !isPremium,
    refetchInterval: 10000,
  });

  return useMemo(() => {
    if (isPremium) {
      return { count: 0, remaining: Infinity, reached: false, unlimited: true as const };
    }
    const count = data?.chat_count ?? 0;
    const remaining = Math.max(0, FREE_AI_DAILY_LIMIT - count);
    const reached = count >= FREE_AI_DAILY_LIMIT;
    return { count, remaining, reached, unlimited: false as const };
  }, [data, isPremium]);
}
