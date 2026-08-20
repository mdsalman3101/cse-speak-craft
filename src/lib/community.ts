import { supabase } from "@/integrations/supabase/client";

export type PostRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  is_question: boolean;
  is_hidden: boolean;
  created_at: string;
};

export type ReplyRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_hidden: boolean;
  created_at: string;
};

export type RoomRow = {
  id: string;
  host_id: string;
  title: string;
  topic: string;
  level: string;
  focus: string;
  scheduled_at: string;
  duration_minutes: number;
  capacity: number;
  meeting_link: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export type RoomMemberRow = {
  id: string;
  room_id: string;
  user_id: string;
  created_at: string;
};

export type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
};

export const POST_CATEGORIES = [
  "general",
  "interview",
  "grammar",
  "speaking",
  "writing",
  "resources",
] as const;

export const ROOM_TOPICS = [
  "Self introduction",
  "Project walkthrough",
  "Mock interview",
  "Daily standup",
  "Group discussion",
  "Tech explanation",
] as const;

export const ROOM_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const ROOM_FOCUS = ["speaking", "shadowing", "translation", "interview"] as const;

export const postsQuery = {
  queryKey: ["community-posts"],
  queryFn: async (): Promise<PostRow[]> => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as PostRow[];
  },
};

export function repliesQuery(postId: string | null) {
  return {
    queryKey: ["community-replies", postId],
    enabled: Boolean(postId),
    queryFn: async (): Promise<ReplyRow[]> => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("community_replies")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ReplyRow[];
    },
  };
}

export const roomsQuery = {
  queryKey: ["speaking-rooms"],
  queryFn: async (): Promise<RoomRow[]> => {
    const { data, error } = await supabase
      .from("speaking_rooms")
      .select("*")
      .order("scheduled_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as RoomRow[];
  },
};

export const roomMembersQuery = {
  queryKey: ["room-members"],
  queryFn: async (): Promise<RoomMemberRow[]> => {
    const { data, error } = await supabase.from("room_members").select("*").limit(1000);
    if (error) throw error;
    return (data ?? []) as unknown as RoomMemberRow[];
  },
};

/** Seat counts for every room (aggregate only — no member identities). */
export const roomSeatCountsQuery = {
  queryKey: ["room-seat-counts"],
  queryFn: async (): Promise<Record<string, number>> => {
    const { data, error } = await supabase.rpc("room_seat_counts");
    if (error) throw error;
    const map: Record<string, number> = {};
    for (const row of (data ?? []) as { room_id: string; seats: number }[]) {
      map[row.room_id] = row.seats;
    }
    return map;
  },
};

export const reportsQuery = {
  queryKey: ["content-reports"],
  queryFn: async (): Promise<ReportRow[]> => {
    const { data, error } = await supabase
      .from("content_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as ReportRow[];
  },
};

export const communityProfilesQuery = {
  queryKey: ["community-profiles"],
  queryFn: async (): Promise<Record<string, { name: string; level: string }>> => {
    const { data, error } = await supabase
      .from("public_profiles")
      .select("id, full_name, current_level");
    if (error) throw error;
    const map: Record<string, { name: string; level: string }> = {};
    for (const row of data ?? []) {
      map[row.id] = {
        name: row.full_name?.trim() || "Learner",
        level: (row as { current_level?: string }).current_level ?? "beginner",
      };
    }
    return map;
  },
};

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

export async function createPost(input: {
  title: string;
  content: string;
  category: string;
  isQuestion: boolean;
}) {
  const uid = await currentUserId();
  const { error } = await supabase.from("community_posts").insert({
    user_id: uid,
    title: input.title,
    content: input.content,
    category: input.category,
    is_question: input.isQuestion,
  });
  if (error) throw error;
}

export async function createReply(postId: string, content: string) {
  const uid = await currentUserId();
  const { error } = await supabase
    .from("community_replies")
    .insert({ post_id: postId, user_id: uid, content });
  if (error) throw error;
}

export async function likePost(post: PostRow) {
  const { error } = await supabase
    .from("community_posts")
    .update({ likes: post.likes + 1 })
    .eq("id", post.id);
  if (error) throw error;
}

export async function setPostHidden(id: string, hidden: boolean) {
  const { error } = await supabase.from("community_posts").update({ is_hidden: hidden }).eq("id", id);
  if (error) throw error;
}

export async function setReplyHidden(id: string, hidden: boolean) {
  const { error } = await supabase.from("community_replies").update({ is_hidden: hidden }).eq("id", id);
  if (error) throw error;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("community_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function reportContent(input: {
  targetType: "post" | "reply" | "room";
  targetId: string;
  reason: string;
  details?: string;
}) {
  const uid = await currentUserId();
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: uid,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    details: input.details ?? null,
  });
  if (error) throw error;
}

export async function resolveReport(id: string, status: "resolved" | "dismissed") {
  const { error } = await supabase.from("content_reports").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function createRoom(input: {
  title: string;
  topic: string;
  level: string;
  focus: string;
  scheduledAt: string;
  durationMinutes: number;
  capacity: number;
  meetingLink?: string;
  notes?: string;
}) {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from("speaking_rooms")
    .insert({
      host_id: uid,
      title: input.title,
      topic: input.topic,
      level: input.level,
      focus: input.focus,
      scheduled_at: new Date(input.scheduledAt).toISOString(),
      duration_minutes: input.durationMinutes,
      capacity: input.capacity,
      meeting_link: input.meetingLink || null,
      notes: input.notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await supabase.from("room_members").insert({ room_id: data.id, user_id: uid });
}

export async function joinRoom(roomId: string) {
  const uid = await currentUserId();
  const { error } = await supabase.from("room_members").insert({ room_id: roomId, user_id: uid });
  if (error) throw error;
}

export async function leaveRoom(roomId: string, userId: string) {
  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setRoomStatus(id: string, status: "open" | "full" | "cancelled" | "done") {
  const { error } = await supabase.from("speaking_rooms").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Simple peer matching score: level match, focus/topic overlap, seats left and time proximity. */
export function matchScore(
  room: RoomRow,
  seatsTaken: number,
  me: { level: string; focus: string; topic: string },
): number {
  let score = 0;
  if (room.level === me.level) score += 40;
  else if (
    (room.level === "intermediate" && me.level !== "intermediate") ||
    (me.level === "intermediate" && room.level !== "intermediate")
  )
    score += 20;
  if (room.focus === me.focus) score += 25;
  if (room.topic === me.topic) score += 20;
  const seatsLeft = room.capacity - seatsTaken;
  if (seatsLeft > 0) score += Math.min(10, seatsLeft * 3);
  const hours = Math.abs(new Date(room.scheduled_at).getTime() - Date.now()) / 3_600_000;
  score += Math.max(0, 15 - hours);
  return Math.round(score);
}
