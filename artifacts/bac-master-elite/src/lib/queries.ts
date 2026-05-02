import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type Profile = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  serie?: string | null;
  is_premium?: boolean;
  is_admin?: boolean;
  points?: number;
  avatar_url?: string | null;
  plan?: "mensuel" | "annuel" | null;
  plan_expires_at?: string | null;
  free_bot_questions_today?: number | null;
  last_activity_date?: string | null;
};

export type Course = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  titre?: string;
  description?: string;
  serie?: string;
  subject?: string;
  matiere?: string;
};

export type Exercise = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  titre?: string;
  difficulty?: string;
  serie?: string;
  subject?: string;
};

export type Annal = Record<string, unknown> & {
  id?: string | number;
  year?: number;
  serie?: string;
  subject?: string;
};

export type Payment = {
  id: string;
  provider: string;
  provider_ref: string;
  user_id: string;
  plan: "mensuel" | "annuel";
  amount: number;
  currency: string;
  status: "initie" | "succes" | "echec" | "rembourse";
  created_at: string;
  paid_at?: string | null;
};

const safeFetch = async <T,>(table: string): Promise<T[]> => {
  const { data, error } = await supabase.from(table).select("*").limit(500);
  if (error) {
    console.warn(`[supabase] table "${table}":`, error.message);
    return [];
  }
  return (data ?? []) as T[];
};

export const useLessons = () =>
  useQuery({ queryKey: ["lessons"], queryFn: () => safeFetch<Course>("lessons") });

export const useExercises = () =>
  useQuery({ queryKey: ["exercises"], queryFn: () => safeFetch<Exercise>("exercises") });

export const useSubjects = () =>
  useQuery({ queryKey: ["subjects"], queryFn: () => safeFetch<Record<string, unknown>>("subjects") });

export const useAnnals = () =>
  useQuery({ queryKey: ["annals"], queryFn: () => safeFetch<Annal>("annales") });

export const useProfile = (userId?: string) =>
  useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        console.warn("[supabase] profile:", error.message);
        return null;
      }
      return data as Profile | null;
    },
    enabled: !!userId,
  });

export const useLeaderboard = () =>
  useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, serie, points, is_premium, avatar_url")
        .order("points", { ascending: false })
        .limit(50);
      if (error) {
        console.warn("[supabase] leaderboard:", error.message);
        return [];
      }
      return (data ?? []) as Profile[];
    },
  });

export const useMyPayments = (userId?: string) =>
  useQuery({
    queryKey: ["payments", "me", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[supabase] payments:", error.message);
        return [];
      }
      return (data ?? []) as Payment[];
    },
    enabled: !!userId,
  });

/**
 * Premium status — true si plan_expires_at > now() OU is_premium=true.
 * Source de vérité : la table profiles, mise à jour automatiquement par
 * l'Edge Function geniuspay-webhook après chaque paiement réussi.
 */
export const usePremiumStatus = (userId?: string) => {
  const profileQ = useProfile(userId);
  const profile = profileQ.data;

  const flagged = profile?.is_premium === true;
  const expiresAt = profile?.plan_expires_at
    ? new Date(profile.plan_expires_at).getTime()
    : 0;
  const stillActive = expiresAt > Date.now();
  const isPremium = flagged || stillActive;

  return {
    isPremium,
    isLoading: profileQ.isLoading,
    expiresAt: profile?.plan_expires_at ?? null,
    plan: profile?.plan ?? null,
  };
};

/**
 * Démarre un checkout GeniusPay et redirige immédiatement l'utilisateur
 * vers l'URL de paiement renvoyée par /api/create-payment.
 */
export const useStartCheckout = () => {
  return useMutation({
    mutationFn: async (plan: "mensuel" | "annuel") => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Vous devez être connecté pour payer.");

      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body as { error?: string }).error ?? "Paiement indisponible.",
        );
      }
      const url = (body as { checkout_url?: string }).checkout_url;
      if (!url) throw new Error("URL de paiement manquante.");
      window.location.href = url;
      return url;
    },
  });
};

/**
 * Quota IA : 3 questions/jour pour les comptes gratuits.
 * Backed by la fonction RPC `increment_ai_question` qui auto-reset chaque jour.
 */
export const useIncrementAIQuestion = () => {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc("check_and_record_usage", {
        p_user_id: userId,
        p_type: "bot",
      });
      if (error) throw new Error(error.message);
      return data as { allowed: boolean; count: number };
    },
  });
};

/**
 * Vérifier + incrémenter l'accès aux cours.
 * 3 cours/jour pour les non-premium, illimité pour premium.
 * Backed by la fonction RPC `check_and_increment_course`.
 */
export const useCheckCourseAccess = () => {
  return useMutation({
    mutationFn: async (params: { userId: string; type: "lesson" | "bot" }) => {
      const { data, error } = await supabase.rpc("check_and_record_usage", {
        p_user_id: params.userId,
        p_type: params.type,
      });
      if (error) throw new Error(error.message);
      return data as { allowed: boolean; count: number };
    },
  });
};
