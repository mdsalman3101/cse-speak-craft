import { supabase } from "@/integrations/supabase/client";

export type Module = {
  id: string;
  number: number;
  title: string;
  description: string;
  tier: number;
  tier_name: string;
  week_start: number;
  week_end: number;
  icon: string | null;
};

export type Lesson = {
  id: string;
  module_id: string | null;
  day_number: number;
  week_number: number;
  title: string;
  description: string;
  objective: string | null;
  speaking_prompt: string | null;
  listening_script: string | null;
  shadowing_lines: unknown;
  duration_minutes: number;
  is_free: boolean;
};

export const TIERS = [
  { tier: 1, name: "Foundation", weeks: "Weeks 1–4" },
  { tier: 2, name: "Communication", weeks: "Weeks 5–8" },
  { tier: 3, name: "Technical Communication", weeks: "Weeks 9–12" },
  { tier: 4, name: "Professional Communication", weeks: "Weeks 13–16" },
  { tier: 5, name: "Advanced Professional English", weeks: "Weeks 17–20" },
  { tier: 6, name: "Mastery", weeks: "Weeks 21–24+" },
];

export const modulesQuery = {
  queryKey: ["modules"],
  queryFn: async (): Promise<Module[]> => {
    const { data, error } = await supabase.from("modules").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as Module[];
  },
};

export const lessonsQuery = {
  queryKey: ["lessons"],
  queryFn: async (): Promise<Lesson[]> => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("week_number")
      .order("day_number");
    if (error) throw error;
    return (data ?? []) as Lesson[];
  },
};

export function lessonQuery(id: string) {
  return {
    queryKey: ["lesson", id],
    queryFn: async () => {
      const [lesson, vocabulary, translations, exercises] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", id).maybeSingle(),
        supabase.from("vocabulary").select("*").eq("lesson_id", id),
        supabase.from("translation_sentences").select("*").eq("lesson_id", id).order("sort_order"),
        supabase.from("exercises").select("*").eq("lesson_id", id).order("sort_order"),
      ]);
      if (lesson.error) throw lesson.error;
      return {
        lesson: lesson.data as Lesson | null,
        vocabulary: vocabulary.data ?? [],
        translations: translations.data ?? [],
        exercises: exercises.data ?? [],
      };
    },
  };
}

export const resourcesQuery = {
  queryKey: ["resources"],
  queryFn: async () => {
    const { data, error } = await supabase.from("resources").select("*").order("created_at");
    if (error) throw error;
    return data ?? [];
  },
};

export const vocabularyQuery = {
  queryKey: ["vocabulary"],
  queryFn: async () => {
    const { data, error } = await supabase.from("vocabulary").select("*").order("word");
    if (error) throw error;
    return data ?? [];
  },
};
