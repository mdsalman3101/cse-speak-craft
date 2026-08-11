import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpeakingRecorder } from "@/components/app/speaking-recorder";
import { speakingSubmissionsQuery } from "@/lib/student";

export const Route = createFileRoute("/_authenticated/speaking")({
  head: () => ({
    meta: [
      { title: "Speaking Practice — CSE Professional English" },
      { name: "description", content: "Record answers to interview and workplace speaking prompts." },
      { property: "og:title", content: "Speaking Practice" },
      { property: "og:description", content: "Daily speaking prompts with mentor review." },
    ],
  }),
  component: SpeakingPage,
});

const PROMPTS = [
  "Introduce yourself to an interviewer in 60 seconds.",
  "Explain a project you built and the problem it solves.",
  "Describe a bug you fixed and how you debugged it.",
  "Give a two-minute daily standup update.",
  "Explain recursion to a non-technical friend.",
  "Answer: Why should we hire you?",
];

function SpeakingPage() {
  const [prompt, setPrompt] = useState(PROMPTS[0]!);
  const submissions = useQuery(speakingSubmissionsQuery);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Speaking practice</h1>
        <p className="mt-1 text-muted-foreground">
          Pick a prompt, record for one to two minutes, then submit for feedback.
        </p>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Choose a prompt</CardTitle>
          <CardDescription>Interview, standup and explanation practice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrompt(p)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  prompt === p ? "border-transparent bg-primary text-primary-foreground" : "border-border hover:bg-accent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="rounded-lg bg-muted p-4 text-sm">{prompt}</p>
          <SpeakingRecorder prompt={prompt} onSubmitted={() => submissions.refetch()} />
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
                  <p className="text-sm font-medium">{String(s["prompt"])}</p>
                  <Badge variant="secondary">{String(s["status"])}</Badge>
                </div>
                {s["transcript"] ? (
                  <p className="text-sm text-muted-foreground">{String(s["transcript"])}</p>
                ) : null}
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
