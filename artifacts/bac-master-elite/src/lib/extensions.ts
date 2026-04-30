import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type QuizResult = {
  id?: string;
  user_id: string;
  serie?: string | null;
  score: number;
  total: number;
  created_at?: string;
};

export type Invitation = {
  id?: string;
  user_id: string;
  invitation_code: string;
  clicks?: number;
  created_at?: string;
};

export type Review = {
  id?: string;
  user_id?: string | null;
  name: string;
  rating: number;
  comment: string;
  serie?: string | null;
  created_at?: string;
};

export type DailyUsageRow = {
  id?: string;
  user_id: string;
  date: string;
  lessons_count?: number;
  chat_count?: number;
  quiz_count?: number;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export const FREE_QUIZ_DAILY_LIMIT = 3;

const randomCode = (len = 8) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export const useAddPointsToProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, delta }: { userId: string; delta: number }) => {
      const { data: current, error: readErr } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .maybeSingle();
      if (readErr) throw new Error(readErr.message);
      const newTotal = (current?.points ?? 0) + delta;
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ points: newTotal })
        .eq("id", userId);
      if (updateErr) throw new Error(updateErr.message);
      return newTotal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
};

export const useSaveQuizResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: QuizResult) => {
      const { error } = await supabase.from("quiz_results").insert(row);
      if (error) {
        console.warn("[quiz_results] insert:", error.message);
      }
      const { data: current, error: readErr } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", row.user_id)
        .maybeSingle();
      if (!readErr) {
        const newTotal = (current?.points ?? 0) + row.score;
        await supabase
          .from("profiles")
          .update({ points: newTotal })
          .eq("id", row.user_id);
      }
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["my-quiz-results"] });
      qc.invalidateQueries({ queryKey: ["daily-usage"] });
    },
  });
};

export const useMyQuizResults = (userId?: string) =>
  useQuery({
    queryKey: ["my-quiz-results", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        console.warn("[quiz_results] fetch:", error.message);
        return [];
      }
      return (data ?? []) as QuizResult[];
    },
    enabled: !!userId,
  });

/**
 * Returns the list of profiles that have referrer_id = userId.
 * Used by the Parrainage page to display "X amis ont rejoint via vous".
 */
export const useMyReferrals = (userId?: string) =>
  useQuery({
    queryKey: ["my-referrals", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, serie, created_at")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[my-referrals] fetch:", error.message);
        return [];
      }
      return (data ?? []) as Array<{
        id: string;
        full_name: string | null;
        serie: string | null;
        created_at: string;
      }>;
    },
    enabled: !!userId,
  });

export const useMyInvitation = (userId?: string) =>
  useQuery({
    queryKey: ["my-invitation", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.warn("[invitations] fetch:", error.message);
        return null;
      }
      return (data ?? null) as Invitation | null;
    },
    enabled: !!userId,
  });

export const useEnsureInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: existing } = await supabase
        .from("invitations")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) return existing as Invitation;

      const code = randomCode(8);
      const { data, error } = await supabase
        .from("invitations")
        .insert({ user_id: userId, invitation_code: code, clicks: 0 })
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Invitation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-invitation"] });
    },
  });
};

/**
 * Public-facing: registers a click on a referral link.
 * Calls the SECURITY DEFINER RPC `register_referral_click` so anonymous
 * visitors can increment the inviter's clicks + points without needing
 * permissive UPDATE policies on `invitations` or `profiles`.
 * Idempotent per browser via localStorage so refreshing doesn't farm points.
 */
export const registerReferralClick = async (code: string) => {
  if (!code) return;
  const seenKey = `bme:ref-seen:${code}`;
  if (typeof window !== "undefined" && window.localStorage.getItem(seenKey)) {
    return;
  }
  const { error } = await supabase.rpc("register_referral_click", { p_code: code });
  if (error) {
    console.warn("[register_referral_click] RPC failed:", error.message);
    return;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(seenKey, "1");
  }
};

/**
 * Returns the current user's existing review, if any.
 * Used to switch the form between "Publish" and "Update" mode.
 */
export const useMyReview = (userId?: string) =>
  useQuery({
    queryKey: ["my-review", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.warn("[reviews] my-review fetch:", error.message);
        return null;
      }
      return (data ?? null) as Review | null;
    },
    enabled: !!userId,
  });

export const useUpdateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Review, "name" | "rating" | "comment" | "serie">>;
    }) => {
      const { data, error } = await supabase
        .from("reviews")
        .update(patch)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["my-review"] });
    },
  });
};

export const useReviews = () =>
  useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        console.warn("[reviews] fetch:", error.message);
        return [];
      }
      return (data ?? []) as Review[];
    },
  });

export const useAddReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Omit<Review, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("reviews")
        .insert(row)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

export const useDailyUsage = (userId?: string) =>
  useQuery({
    queryKey: ["daily-usage", userId, todayISO()],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("daily_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("date", todayISO())
        .maybeSingle();
      if (error) {
        console.warn("[daily_usage] fetch:", error.message);
        return null;
      }
      return (data ?? null) as DailyUsageRow | null;
    },
    enabled: !!userId,
  });

/**
 * Increments a counter on daily_usage for the current day.
 * Returns the row AFTER increment, with a derived `allowed` flag against the limit.
 * Used for QUIZ daily limits (the existing chat/lesson limits stay on their own RPCs).
 */
export const useIncrementDailyUsage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      column,
      limit,
    }: {
      userId: string;
      column: "lessons_count" | "chat_count" | "quiz_count";
      limit: number;
    }) => {
      const today = todayISO();
      const { data: existing } = await supabase
        .from("daily_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      const current = (existing?.[column] as number | undefined) ?? 0;
      if (current >= limit) {
        return { allowed: false, current, limit } as const;
      }

      const next = current + 1;
      if (existing?.id) {
        const { error } = await supabase
          .from("daily_usage")
          .update({ [column]: next })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("daily_usage").insert({
          user_id: userId,
          date: today,
          [column]: next,
        });
        if (error) throw new Error(error.message);
      }
      return { allowed: true, current: next, limit } as const;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-usage"] });
    },
  });
};
