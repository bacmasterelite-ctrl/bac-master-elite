import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type Course = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  titre?: string;
  description?: string;
  serie?: string;
  subject_id?: string | number;
};

export type Exercise = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  titre?: string;
  difficulty?: string;
  serie?: string;
};

export type Subject = Record<string, unknown> & {
  id?: string | number;
  name?: string;
  nom?: string;
};

export type Annal = Record<string, unknown> & {
  id?: string | number;
  year?: number;
  annee?: number;
  serie?: string;
  subject?: string;
};

export type SeriesRow = Record<string, unknown> & {
  id?: string | number;
  code?: string;
  name?: string;
  nom?: string;
};

const safeFetch = async <T,>(table: string): Promise<T[]> => {
  const { data, error } = await supabase.from(table).select("*").limit(200);
  if (error) {
    console.warn(`[supabase] table "${table}":`, error.message);
    return [];
  }
  return (data ?? []) as T[];
};

export const useLessons = () =>
  useQuery({
    queryKey: ["lessons"],
    queryFn: () => safeFetch<Course>("lessons"),
  });

export const useExercises = () =>
  useQuery({
    queryKey: ["exercises"],
    queryFn: () => safeFetch<Exercise>("exercises"),
  });

export const useSubjects = () =>
  useQuery({
    queryKey: ["subjects"],
    queryFn: () => safeFetch<Subject>("subjects"),
  });

export const useAnnals = () =>
  useQuery({
    queryKey: ["annals"],
    queryFn: () => safeFetch<Annal>("annals"),
  });

export const useSeries = () =>
  useQuery({
    queryKey: ["series"],
    queryFn: () => safeFetch<SeriesRow>("series"),
  });

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
      return data;
    },
    enabled: !!userId,
  });
