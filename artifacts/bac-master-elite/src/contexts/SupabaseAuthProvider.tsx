import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { readStoredReferrer, clearStoredReferrer } from "@/components/RefTracker";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureProfile(user: User) {
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Élève";
  const serie = (user.user_metadata?.serie as string | undefined) ?? "D";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      serie,
    },
    { onConflict: "id", ignoreDuplicates: false },
  );
  if (error) {
    console.warn("[profile upsert]", error.message);
  }

  // Apply referral if we have a pending one in localStorage.
  // Idempotent + anti self-referral handled inside the SQL function.
  const referrerId = readStoredReferrer();
  if (referrerId && referrerId !== user.id) {
    const { error: refErr } = await supabase.rpc("register_referral_signup", {
      p_user: user.id,
      p_referrer: referrerId,
    });
    if (refErr) {
      console.warn("[register_referral_signup]", refErr.message);
    } else {
      clearStoredReferrer();
    }
  }
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        if (event === "SIGNED_IN" && newSession?.user) {
          void ensureProfile(newSession.user);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signIn: async (email, password) => {
        const MAX_ATTEMPTS = 5;
        const BLOCK_MINUTES = 15;

        // Vérifier le blocage brute-force
        const since = new Date(Date.now() - BLOCK_MINUTES * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("login_attempts")
          .select("*", { count: "exact", head: true })
          .eq("email", email)
          .eq("success", false)
          .gte("attempted_at", since);

        if ((count ?? 0) >= MAX_ATTEMPTS) {
          return { error: `Trop de tentatives échouées. Réessaie dans ${BLOCK_MINUTES} minutes.` };
        }

        // Vérifier si l'email existe
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (!profile) {
          await supabase.from("login_attempts").insert({ email, success: false });
          return { error: "Aucun compte trouvé pour cet email." };
        }

        // Tenter la connexion
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          await supabase.from("login_attempts").insert({ email, success: false });
          return { error: "Mot de passe incorrect." };
        }

        // Succès : effacer les tentatives
        await supabase.from("login_attempts").delete().eq("email", email);
        return { error: null };
      },
      signUp: async (email, password, metadata) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });
        if (!error && data.user) {
          await ensureProfile(data.user);
        }
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return ctx;
}
