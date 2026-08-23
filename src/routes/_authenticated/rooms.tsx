import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  ROOM_FOCUS,
  ROOM_LEVELS,
  ROOM_TOPICS,
  communityProfilesQuery,
  createRoom,
  joinRoom,
  leaveRoom,
  matchScore,
  roomActivityQuery,
  roomMembersQuery,

  roomSeatCountsQuery,
  roomsQuery,
  setRoomStatus,
  type RoomRow,
} from "@/lib/community";

export const Route = createFileRoute("/_authenticated/rooms")({
  head: () => ({
    meta: [
      { title: "Peer Speaking Rooms — CSE Professional English" },
      {
        name: "description",
        content: "Find matched peer speaking rooms, host your own session and practise live.",
      },
      { property: "og:title", content: "Peer Speaking Rooms" },
      { property: "og:description", content: "Matched practice rooms for CSE students." },
    ],
  }),
  component: RoomsPage,
});

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function defaultScheduledAt() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const ACTIVITY_LABEL: Record<string, string> = {
  room_joined: "Joined",
  room_left: "Left",
  room_full: "Joining closed",
  room_open: "Joining reopened",
  room_done: "Marked done",
  room_cancelled: "Cancelled",
};

function activityTone(category: string) {
  if (category === "report") return "bg-destructive/10 text-destructive";
  if (category === "membership") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
}

type FilterKey = "joins" | "leaves" | "hostActions" | "reports";

const FILTER_CONFIG: { key: FilterKey; label: string; test: (r: ActivityRow) => boolean }[] = [
  { key: "joins", label: "Joins", test: (r) => r.action === "room_joined" },
  { key: "leaves", label: "Leaves", test: (r) => r.action === "room_left" },
  { key: "hostActions", label: "Host actions", test: (r) =>
      r.action === "room_full" || r.action === "room_open" || r.action === "room_done" || r.action === "room_cancelled" },
  { key: "reports", label: "Reports", test: (r) => r.category === "report" },
];

function RoomTimeline({ roomId }: { roomId: string }) {
  const activity = useQuery(roomActivityQuery(roomId));
  const [visible, setVisible] = useState<Set<FilterKey>>(
    () => new Set(FILTER_CONFIG.map((f) => f.key))
  );

  if (activity.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  }
  if (activity.isError) {
    return <p className="text-sm text-destructive">Could not load this room&apos;s activity.</p>;
  }
  const rows = activity.data ?? [];
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  const filtered = rows.filter((r) => FILTER_CONFIG.some((f) => visible.has(f.key) && f.test(r)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_CONFIG.map((f) => {
          const active = visible.has(f.key);
          return (
            <Button
              key={f.key}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() =>
                setVisible((prev) => {
                  const next = new Set(prev);
                  if (next.has(f.key)) next.delete(f.key);
                  else next.add(f.key);
                  return next;
                })
              }
            >
              {active ? "✓" : "○"} {f.label}
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity matches the selected filters.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-4">
          {filtered.map((r) => (
            <li key={r.id} className="space-y-1">
              <span
                className="absolute -left-[5px] mt-1.5 size-2 rounded-full bg-primary"
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={activityTone(r.category)}>
                  {ACTIVITY_LABEL[r.action] ?? r.action.replaceAll("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatWhen(r.created_at)}</span>
              </div>
              <p className="text-sm">{r.summary}</p>
              <p className="text-xs text-muted-foreground">By {r.actor_name}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}



function RoomsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const rooms = useQuery(roomsQuery);
  const members = useQuery(roomMembersQuery);
  const seatCounts = useQuery(roomSeatCountsQuery);
  const profiles = useQuery(communityProfilesQuery);

  const myLevelFromProfile = user ? profiles.data?.[user.id]?.level : undefined;
  const [level, setLevel] = useState<string>("");
  const [focus, setFocus] = useState<string>(ROOM_FOCUS[0]);
  const [topic, setTopic] = useState<string>(ROOM_TOPICS[0]);
  const myLevel = level || myLevelFromProfile || "beginner";

  const [timelineOpen, setTimelineOpen] = useState<Set<string>>(() => new Set());
  function toggleTimeline(id: string) {
    setTimelineOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }


  const [form, setForm] = useState({
    title: "",
    topic: ROOM_TOPICS[0] as string,
    level: "intermediate",
    focus: ROOM_FOCUS[0] as string,
    scheduledAt: defaultScheduledAt(),
    durationMinutes: 30,
    capacity: 4,
    meetingLink: "",
    notes: "",
  });

  function refresh() {
    void qc.invalidateQueries({ queryKey: roomsQuery.queryKey });
    void qc.invalidateQueries({ queryKey: roomMembersQuery.queryKey });
    void qc.invalidateQueries({ queryKey: roomSeatCountsQuery.queryKey });
    void qc.invalidateQueries({ queryKey: ["room-activity"] });

  }

  const create = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      toast.success("Room created — you are the host.");
      setForm((f) => ({ ...f, title: "", meetingLink: "", notes: "" }));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const join = useMutation({
    mutationFn: joinRoom,
    onSuccess: () => {
      toast.success("Joined the room.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leave = useMutation({
    mutationFn: (roomId: string) => leaveRoom(roomId, user!.id),
    onSuccess: () => {
      toast.success("Left the room.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const status = useMutation({
    mutationFn: (v: { id: string; status: "open" | "full" | "cancelled" | "done" }) =>
      setRoomStatus(v.id, v.status),
    onSuccess: () => {
      toast.success("Room updated.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seatsByRoom = useMemo(() => seatCounts.data ?? {}, [seatCounts.data]);

  const myRoomIds = useMemo(
    () => new Set((members.data ?? []).filter((m) => m.user_id === user?.id).map((m) => m.room_id)),
    [members.data, user?.id],
  );

  const upcoming = useMemo(
    () => (rooms.data ?? []).filter((r) => r.status !== "cancelled" && r.status !== "done"),
    [rooms.data],
  );

  const matched = useMemo(
    () =>
      [...upcoming]
        .map((r) => ({
          room: r,
          score: matchScore(r, seatsByRoom[r.id] ?? 0, { level: myLevel, focus, topic }),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    [upcoming, seatsByRoom, myLevel, focus, topic],
  );

  function RoomCard({ room, score }: { room: RoomRow; score?: number }) {
    const seats = seatsByRoom[room.id] ?? 0;
    const seatsLeft = Math.max(0, room.capacity - seats);
    const isHost = room.host_id === user?.id;
    const joined = myRoomIds.has(room.id);
    const hostName = profiles.data?.[room.host_id]?.name ?? "Learner";

    return (
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{room.title}</CardTitle>
              <CardDescription>
                Hosted by {isHost ? "you" : hostName} · {formatWhen(room.scheduled_at)} ·{" "}
                {room.duration_minutes} min
              </CardDescription>
            </div>
            {typeof score === "number" ? <Badge>{score}% match</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{room.topic}</Badge>
            <Badge variant="secondary">{room.level}</Badge>
            <Badge variant="secondary">{room.focus}</Badge>
            <Badge variant="outline">
              {seats}/{room.capacity} joined
            </Badge>
            <Badge variant="outline">{room.status}</Badge>
          </div>

          {room.notes ? <p className="text-sm text-muted-foreground">{room.notes}</p> : null}

          {joined && room.meeting_link ? (
            <a
              href={room.meeting_link}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline underline-offset-4"
            >
              Open meeting link
            </a>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {joined ? (
              <Button
                variant="outline"
                size="sm"
                disabled={leave.isPending}
                onClick={() => leave.mutate(room.id)}
              >
                Leave room
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={join.isPending || seatsLeft === 0 || room.status !== "open"}
                onClick={() => join.mutate(room.id)}
              >
                {seatsLeft === 0 ? "Room full" : "Join room"}
              </Button>
            )}

            {isHost ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={status.isPending}
                  onClick={() =>
                    status.mutate({ id: room.id, status: room.status === "open" ? "full" : "open" })
                  }
                >
                  {room.status === "open" ? "Close joining" : "Reopen joining"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={status.isPending}
                  onClick={() => status.mutate({ id: room.id, status: "done" })}
                >
                  Mark done
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={status.isPending}
                  onClick={() => status.mutate({ id: room.id, status: "cancelled" })}
                >
                  Cancel
                </Button>
              </>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              aria-expanded={timelineOpen.has(room.id)}
              onClick={() => toggleTimeline(room.id)}
            >
              {timelineOpen.has(room.id) ? "Hide activity" : "Activity timeline"}
            </Button>
          </div>

          {timelineOpen.has(room.id) ? (
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 text-sm font-medium">Room activity</h3>
              <RoomTimeline roomId={room.id} />
            </div>
          ) : null}
        </CardContent>

      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Peer speaking rooms</h1>
        <p className="mt-1 text-muted-foreground">
          Match with peers at your level, join a live practice room or host your own.
        </p>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Your matching preferences</CardTitle>
          <CardDescription>We rank rooms by level, focus, topic, seats and timing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={myLevel} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Focus</Label>
            <Select value={focus} onValueChange={setFocus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_FOCUS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Matched for you</h2>
        {rooms.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading rooms…</p>
        ) : matched.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming rooms yet — host the first one below.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matched.map(({ room, score }) => (
              <RoomCard key={room.id} room={room} score={Math.min(100, score)} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">All upcoming rooms</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled right now.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Host a room</CardTitle>
          <CardDescription>You join automatically as the host.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim()) {
                toast.error("Add a room title.");
                return;
              }
              create.mutate({
                title: form.title.trim(),
                topic: form.topic,
                level: form.level,
                focus: form.focus,
                scheduledAt: form.scheduledAt,
                durationMinutes: Number(form.durationMinutes),
                capacity: Number(form.capacity),
                meetingLink: form.meetingLink,
                notes: form.notes,
              });
            }}
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="room-title">Title</Label>
              <Input
                id="room-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Evening mock interview practice"
              />
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Focus</Label>
              <Select value={form.focus} onValueChange={(v) => setForm({ ...form, focus: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_FOCUS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-when">Date & time</Label>
              <Input
                id="room-when"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-duration">Duration (minutes)</Label>
              <Input
                id="room-duration"
                type="number"
                min={10}
                max={120}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-capacity">Capacity</Label>
              <Input
                id="room-capacity"
                type="number"
                min={2}
                max={12}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="room-link">Meeting link (optional)</Label>
              <Input
                id="room-link"
                value={form.meetingLink}
                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="room-notes">Notes (optional)</Label>
              <Textarea
                id="room-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="What will you practise? Anything participants should prepare?"
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Create room"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
