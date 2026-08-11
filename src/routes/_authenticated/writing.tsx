import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { logActivity, writingSubmissionsQuery } from "@/lib/student";

export const Route = createFileRoute("/_authenticated/writing")({
  head: () => ({
    meta: [
      { title: "Writing Practice — CSE Professional English" },
      { name: "description", content: "Practise professional emails, bug reports and documentation." },
      { property: "og:title", content: "Writing Practice" },
      { property: "og:description", content: "Email, report and documentation writing tasks." },
    ],
  }),
  component: WritingPage,
});

const TASKS = [
  { type: "email", situation: "Write an email to your manager requesting two days of leave." },
  { type: "email", situation: "Reply to a client who reported that the login page is slow." },
  { type: "bug_report", situation: "Write a bug report for a checkout button that fails on mobile." },
  { type: "documentation", situation: "Document a REST endpoint that returns a user's profile." },
  { type: "linkedin", situation: "Write a LinkedIn summary for a final-year CSE student." },
];

function WritingPage() {
  const [task, setTask] = useState(TASKS[0]!);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const submissions = useQuery(writingSubmissionsQuery);
  const queryClient = useQueryClient();

  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  async function submit() {
    if (words < 20) {
      toast.error("Write at least 20 words before submitting.");
      return;
    }
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("writing_submissions").insert({
      user_id: uid,
      exercise_type: task.type,
      situation: task.situation,
      answer,
      status: "submitted",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity({ minutes: 10, xp: 20 });
    setAnswer("");
    toast.success("Submitted for mentor review.");
    await queryClient.invalidateQueries({ queryKey: writingSubmissionsQuery.queryKey });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Writing practice</h1>
        <p className="mt-1 text-muted-foreground">
          Professional writing for the situations you'll actually meet at work.
        </p>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Pick a task</CardTitle>
          <CardDescription>Emails, bug reports, docs and profiles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TASKS.map((t) => (
              <button
                key={t.situation}
                type="button"
                onClick={() => setTask(t)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  task.situation === t.situation
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {t.type.replace("_", " ")}
              </button>
            ))}
          </div>
          <p className="rounded-lg bg-muted p-4 text-sm">{task.situation}</p>
          <Textarea rows={10} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Submit for review"}
            </Button>
            <span className="text-xs text-muted-foreground">{words} words</span>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Your submissions</h2>
        {(submissions.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing submitted yet.</p>
        ) : (
          (submissions.data ?? []).map((s: Record<string, unknown>) => (
            <Card key={String(s["id"])} className="shadow-soft">
              <CardContent className="space-y-2 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{String(s["situation"])}</p>
                  <Badge variant="secondary">{String(s["status"])}</Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {String(s["answer"])}
                </p>
                {s["mentor_feedback"] ? (
                  <p className="rounded-md bg-muted p-3 text-sm">
                    Mentor: {String(s["mentor_feedback"])}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
