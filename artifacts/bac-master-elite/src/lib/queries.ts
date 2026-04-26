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

export type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  currency: string;
  payment_method?: string | null;
  proof_url?: string | null;
  status: "en_attente" | "valide" | "rejete";
  created_at: string;
  validated_at?: string | null;
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

export const useMySubscriptions = (userId?: string) =>
  useQuery({
    queryKey: ["subscriptions", "me", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[supabase] subscriptions:", error.message);
        return [];
      }
      return (data ?? []) as Subscription[];
    },
    enabled: !!userId,
  });

/**
 * Premium status — true if the user's profile is flagged premium OR they hold
 * a validated 'premium' subscription. Source of truth is reactive across both.
 */
export const usePremiumStatus = (userId?: string) => {
  const profileQ = useProfile(userId);
  const subsQ = useMySubscriptions(userId);

  const profilePremium = profileQ.data?.is_premium === true;
  const validSub = (subsQ.data ?? []).some(
    (s) => s.status === "valide" && /premium/i.test(s.plan ?? ""),
  );
  const isPremium = profilePremium || validSub;

  return {
    isPremium,
    isLoading: profileQ.isLoading || subsQ.isLoading,
  };
};

export const usePendingSubscriptions = () =>
  useQuery({
    queryKey: ["subscriptions", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, profile:profiles(id, full_name, email, serie, is_premium)")
        .eq("status", "en_attente")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[supabase] pending subscriptions:", error.message);
        return [];
      }
      return (data ?? []) as (Subscription & { profile?: Profile })[];
    },
  });

export type SubmitProofInput = {
  userId: string;
  file: File;
  paymentMethod: "wave" | "mtn" | "orange";
  amount: number;
  plan: string;
};

export const useSubmitPaymentProof = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitProofInput) => {
      const ext = input.file.name.split(".").pop() ?? "png";
      const path = `${input.userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(path, input.file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase.from("subscriptions").insert({
        user_id: input.userId,
        plan: input.plan,
        amount: input.amount,
        payment_method: input.paymentMethod,
        proof_url: path,
        status: "en_attente",
      });
      if (insertError) throw new Error(insertError.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
};

export const useValidateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subscriptionId: string; userId: string; approve: boolean }) => {
      const newStatus = input.approve ? "valide" : "rejete";
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({ status: newStatus, validated_at: new Date().toISOString() })
        .eq("id", input.subscriptionId);
      if (subError) throw new Error(subError.message);

      if (input.approve) {
        const { error: profError } = await supabase
          .from("profiles")
          .update({ is_premium: true })
          .eq("id", input.userId);
        if (profError) throw new Error(profError.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

// Get a signed URL for a file in the 'proofs' bucket
export async function getProofSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path, expiresIn);
  if (error) {
    console.warn("[supabase] signed url:", error.message);
    return null;
  }
  return data.signedUrl;
}
