import { supabase } from "@/integrations/supabase/client";

export type SessionRow = {
  id: string;
  title: string;
  description: string;
  mentor_id: string | null;
  mentor_name: string;
  session_date: string;
  session_time: string;
  status: string;
  created_at: string;
};

export type RegistrationRow = {
  id: string;
  session_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const SESSION_COLUMNS =
  "id, title, description, mentor_id, mentor_name, session_date, session_time, status, created_at";

export const liveSessionsQuery = {
  queryKey: ["live-sessions"],
  queryFn: async (): Promise<SessionRow[]> => {
    const { data, error } = await supabase
      .from("live_sessions")
      .select(SESSION_COLUMNS)
      .order("session_date", { ascending: true })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as unknown as SessionRow[];
  },
};

/** Own requests for a learner; all requests when the viewer is a mentor/admin. */
export const registrationsQuery = {
  queryKey: ["session-registrations"],
  queryFn: async (): Promise<RegistrationRow[]> => {
    const { data, error } = await supabase
      .from("session_registrations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []) as unknown as RegistrationRow[];
  },
};

export function meetingLinkQuery(sessionId: string, enabled: boolean) {
  return {
    queryKey: ["session-meeting-link", sessionId],
    enabled,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.rpc("get_session_meeting_link", {
        _session_id: sessionId,
      });
      if (error) throw error;
      return (data as string | null) ?? null;
    },
  };
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

export async function requestAccess(sessionId: string, note: string) {
  const uid = await currentUserId();
  const { error } = await supabase.from("session_registrations").insert({
    session_id: sessionId,
    user_id: uid,
    note: note.trim() || null,
  });
  if (error) {
    if (error.code === "23505") throw new Error("You already requested access to this session.");
    throw error;
  }
}

export async function cancelRequest(registrationId: string) {
  const { error } = await supabase
    .from("session_registrations")
    .delete()
    .eq("id", registrationId);
  if (error) throw error;
}

export async function reviewRequest(
  registrationId: string,
  status: "approved" | "rejected",
): Promise<void> {
  const uid = await currentUserId();
  const { error } = await supabase
    .from("session_registrations")
    .update({ status, reviewed_by: uid, reviewed_at: new Date().toISOString() })
    .eq("id", registrationId);
  if (error) throw error;
}

export function formatSessionWhen(date: string, time: string) {
  const d = new Date(`${date}T00:00:00`);
  return `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ${time}`;
}
