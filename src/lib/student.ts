import { supabase } from "@/integrations/supabase/client";

export type ProgressRow = {
  id: string;
  lesson_id: string;
  completed: boolean;
  completion_percentage: number;
  minutes_spent: number;
  quiz_score: number | null;
  sections_done: string[] | unknown;
  last_accessed: string;
};

export type DailyActivityRow = {
  activity_date: string;
  minutes: number;
  xp: number;
  words_learned: number;
  tasks: unknown;
};

export const progressQuery = {
  queryKey: ["progress"],
  queryFn: async (): Promise<ProgressRow[]> => {
    const { data, error } = await supabase.from("progress").select("*");
    if (error) throw error;
    return (data ?? []) as unknown as ProgressRow[];
  },
};

export const activityQuery = {
  queryKey: ["daily-activity"],
  queryFn: async (): Promise<DailyActivityRow[]> => {
    const { data, error } = await supabase
      .from("daily_activity")
      .select("*")
      .order("activity_date", { ascending: false })
      .limit(180);
    if (error) throw error;
    return (data ?? []) as unknown as DailyActivityRow[];
  },
};

export const profileQuery = {
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (error) throw error;
    return data;
  },
};

export const speakingSubmissionsQuery = {
  queryKey: ["speaking-submissions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("speaking_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

export const writingSubmissionsQuery = {
  queryKey: ["writing-submissions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("writing_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

export const badgesQuery = {
  queryKey: ["badges"],
  queryFn: async () => {
    const [all, earned] = await Promise.all([
      supabase.from("badges").select("*"),
      supabase.from("user_badges").select("badge_code, earned_at"),
    ]);
    return { all: all.data ?? [], earned: earned.data ?? [] };
  },
};

export const communityQuery = {
  queryKey: ["community-posts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  },
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Consecutive-day streak ending today or yesterday. */
export function computeStreak(rows: DailyActivityRow[]): number {
  const days = new Set(rows.filter((r) => r.minutes > 0).map((r) => r.activity_date));
  if (days.size === 0) return 0;
  const cursor = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(iso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Adds minutes / xp / words to today's activity row (upsert). */
export async function logActivity(input: { minutes?: number; xp?: number; words?: number }) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const date = todayISO();
  const { data: existing } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", uid)
    .eq("activity_date", date)
    .maybeSingle();

  const row = {
    user_id: uid,
    activity_date: date,
    minutes: (existing?.minutes ?? 0) + (input.minutes ?? 0),
    xp: (existing?.xp ?? 0) + (input.xp ?? 0),
    words_learned: (existing?.words_learned ?? 0) + (input.words ?? 0),
  };
  await supabase.from("daily_activity").upsert(row, { onConflict: "user_id,activity_date" });
}

export async function saveLessonProgress(input: {
  lessonId: string;
  sectionsDone: string[];
  totalSections: number;
  quizScore?: number | null;
  minutes?: number;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  const pct = Math.round((input.sectionsDone.length / input.totalSections) * 100);
  await supabase.from("progress").upsert(
    {
      user_id: uid,
      lesson_id: input.lessonId,
      sections_done: input.sectionsDone,
      completion_percentage: pct,
      completed: pct >= 100,
      quiz_score: input.quizScore ?? null,
      minutes_spent: input.minutes ?? 0,
      last_accessed: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );
}
