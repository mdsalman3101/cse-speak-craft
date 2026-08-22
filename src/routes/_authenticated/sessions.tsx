import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { communityProfilesQuery } from "@/lib/community";
import {
  cancelRequest,
  formatSessionWhen,
  liveSessionsQuery,
  meetingLinkQuery,
  registrationsQuery,
  requestAccess,
  reviewRequest,
  type RegistrationRow,
  type SessionRow,
} from "@/lib/sessions";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({
    meta: [
      { title: "Live Sessions & Access Requests — CSE Professional English" },
      {
        name: "description",
        content:
          "Request access to mentor-led live sessions and get the meeting link once your request is approved.",
      },
      { property: "og:title", content: "Live Sessions & Access Requests" },
      {
        property: "og:description",
        content: "Request access to live mentor sessions and join once approved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SessionsPage,
});

function StatusBadge({ status }: { status: RegistrationRow["status"] }) {
  const variant = status === "approved" ? "default" : status === "rejected" ? "outline" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function MeetingLink({ sessionId }: { sessionId: string }) {
  const link = useQuery(meetingLinkQuery(sessionId, true));
  if (link.isLoading) return <p className="text-sm text-muted-foreground">Fetching meeting link…</p>;
  if (!link.data)
    return (
      <p className="text-sm text-muted-foreground">
        No meeting link has been added for this session yet.
      </p>
    );
  return (
    <a
      href={link.data}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-primary underline underline-offset-4"
    >
      Open meeting link
    </a>
  );
}

function SessionsPage() {
  const { user, hasRole } = useAuth();
  const isStaff = hasRole("mentor") || hasRole("admin");
  const qc = useQueryClient();

  const sessions = useQuery(liveSessionsQuery);
  const registrations = useQuery(registrationsQuery);
  const profiles = useQuery(communityProfilesQuery);

  const [notes, setNotes] = useState<Record<string, string>>({});

  function refresh() {
    void qc.invalidateQueries({ queryKey: registrationsQuery.queryKey });
    void qc.invalidateQueries({ queryKey: ["session-meeting-link"] });
  }

  const request = useMutation({
    mutationFn: (v: { sessionId: string; note: string }) => requestAccess(v.sessionId, v.note),
    onSuccess: (_d, v) => {
      toast.success("Access requested — a mentor will review it shortly.");
      setNotes((n) => ({ ...n, [v.sessionId]: "" }));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      toast.success("Request withdrawn.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" }) =>
      reviewRequest(v.id, v.status),
    onSuccess: () => {
      toast.success("Request updated.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const myRegBySession = useMemo(() => {
    const map: Record<string, RegistrationRow> = {};
    for (const r of registrations.data ?? []) {
      if (r.user_id === user?.id) map[r.session_id] = r;
    }
    return map;
  }, [registrations.data, user?.id]);

  const pendingQueue = useMemo(
    () => (registrations.data ?? []).filter((r) => r.status === "pending"),
    [registrations.data],
  );

  const sessionsById = useMemo(() => {
    const map: Record<string, SessionRow> = {};
    for (const s of sessions.data ?? []) map[s.id] = s;
    return map;
  }, [sessions.data]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Live sessions</h1>
        <p className="mt-1 text-muted-foreground">
          Request a seat in a mentor-led session. The meeting link unlocks as soon as your request is
          approved.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Upcoming sessions</h2>
        {sessions.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : (sessions.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(sessions.data ?? []).map((s) => {
              const reg = myRegBySession[s.id];
              const approved = isStaff || reg?.status === "approved";
              return (
                <Card key={s.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{s.title}</CardTitle>
                        <CardDescription>
                          {s.mentor_name} · {formatSessionWhen(s.session_date, s.session_time)}
                        </CardDescription>
                      </div>
                      {reg ? <StatusBadge status={reg.status} /> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                    <Badge variant="outline">{s.status}</Badge>

                    {approved ? (
                      <MeetingLink sessionId={s.id} />
                    ) : reg?.status === "pending" ? (
                      <p className="text-sm text-muted-foreground">
                        Waiting for mentor approval — the link appears here once approved.
                      </p>
                    ) : reg?.status === "rejected" ? (
                      <p className="text-sm text-muted-foreground">
                        This request was declined. You can withdraw it and ask again.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor={`note-${s.id}`}>Why do you want to join? (optional)</Label>
                        <Textarea
                          id={`note-${s.id}`}
                          value={notes[s.id] ?? ""}
                          onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                          placeholder="I want to practise mock interview answers."
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {reg ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancel.isPending}
                          onClick={() => cancel.mutate(reg.id)}
                        >
                          Withdraw request
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={request.isPending}
                          onClick={() =>
                            request.mutate({ sessionId: s.id, note: notes[s.id] ?? "" })
                          }
                        >
                          Request access
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {isStaff ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl">Access requests</h2>
          {pendingQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingQueue.map((r) => (
                <Card key={r.id} className="shadow-soft">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {profiles.data?.[r.user_id]?.name ?? "Learner"} →{" "}
                        {sessionsById[r.session_id]?.title ?? "Session"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.note ?? "No note provided."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: r.id, status: "approved" })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: r.id, status: "rejected" })}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
