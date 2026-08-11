import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteLayout } from "@/components/site/site-layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/trial")({
  head: () => ({
    meta: [
      { title: "Free Trial Lesson — Self Introduction Basics" },
      {
        name: "description",
        content:
          "Try Day 1 of the program for free: shadowing lines, vocabulary with Hindi meanings, Hindi to English translation and a speaking prompt.",
      },
      { property: "og:title", content: "Free Trial Lesson" },
      {
        property: "og:description",
        content: "Preview Day 1: self introduction basics for CSE students.",
      },
    ],
  }),
  component: TrialPage,
});

const trialQuery = {
  queryKey: ["trial-lesson"],
  queryFn: async () => {
    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("is_free", true)
      .order("day_number")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!lesson) return { lesson: null, vocabulary: [], translations: [] };
    const [vocabulary, translations] = await Promise.all([
      supabase.from("vocabulary").select("*").eq("lesson_id", lesson.id).limit(5),
      supabase.from("translation_sentences").select("*").eq("lesson_id", lesson.id).limit(5),
    ]);
    return {
      lesson,
      vocabulary: vocabulary.data ?? [],
      translations: translations.data ?? [],
    };
  },
};

function TrialPage() {
  const { data, isLoading, isError } = useQuery(trialQuery);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const lesson = data?.lesson;
  const shadowing = Array.isArray(lesson?.shadowing_lines) ? (lesson.shadowing_lines as string[]) : [];

  return (
    <SiteLayout>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <Badge variant="secondary">Free preview · Week 1, Day 1</Badge>
          <h1 className="mt-4 text-4xl font-semibold">{lesson?.title ?? "Self Introduction Basics"}</h1>
          <p className="mt-3 text-muted-foreground">
            {lesson?.description ?? "Build a clear, natural introduction you can use anywhere."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
        {isError ? (
          <p className="text-sm text-destructive">Couldn't load the trial lesson. Please refresh.</p>
        ) : null}
        {isLoading ? (
          <>
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </>
        ) : (
          <>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Listening script</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed">{lesson?.listening_script}</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Shadowing lines</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {shadowing.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Vocabulary preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data?.vocabulary ?? []).map((w: Record<string, unknown>) => (
                  <div key={String(w.id)} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-lg">{String(w.word)}</span>
                      <span className="text-sm text-muted-foreground">{String(w.pronunciation)}</span>
                      <Badge variant="outline">{String(w.part_of_speech)}</Badge>
                    </div>
                    <p className="mt-1 text-sm">{String(w.meaning)}</p>
                    <p className="text-sm text-muted-foreground">{String(w.hindi_meaning)}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {(w.examples as string[]).map((ex) => (
                        <li key={ex}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Translation practice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.translations ?? []).map((t: Record<string, unknown>) => {
                  const id = String(t.id);
                  return (
                    <div key={id} className="rounded-lg border border-border p-4">
                      <p className="text-sm">{String(t.hindi)}</p>
                      {revealed[id] ? (
                        <p className="mt-2 text-sm font-medium text-success">{String(t.english)}</p>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => setRevealed((r) => ({ ...r, [id]: true }))}
                        >
                          Show answer
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="surface-hero border-0">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <h2 className="text-2xl font-semibold">Speaking prompt</h2>
                <p className="max-w-xl text-ink-foreground/85">{lesson?.speaking_prompt}</p>
                <p className="text-sm text-ink-foreground/70">
                  Recording, feedback and progress tracking unlock with a free account.
                </p>
                <Button asChild size="lg">
                  <Link to="/auth">Create free account</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
