import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/student";

export const Route = createFileRoute("/_authenticated/translation")({
  head: () => ({
    meta: [
      { title: "Translation Practice — CSE Professional English" },
      { name: "description", content: "Translate everyday Hindi sentences into natural English." },
      { property: "og:title", content: "Translation Practice" },
      { property: "og:description", content: "Hindi to English daily translation drills." },
    ],
  }),
  component: TranslationPage,
});

type Row = { id: string; hindi: string; english: string; hint: string | null };

const sentencesQuery = {
  queryKey: ["translation-sentences"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("translation_sentences")
      .select("*")
      .order("sort_order")
      .limit(60);
    if (error) throw error;
    return (data ?? []) as unknown as Row[];
  },
};

function similarity(a: string, b: string) {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const x = norm(a);
  const y = new Set(norm(b));
  if (!x.length) return 0;
  return Math.round((x.filter((w) => y.has(w)).length / Math.max(x.length, y.size)) * 100);
}

function TranslationPage() {
  const { data, isLoading } = useQuery(sentencesQuery);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState<number | null>(null);

  const rows = data ?? [];
  const current = rows[index];

  async function check() {
    if (!current || !value.trim()) return;
    const score = similarity(value, current.english);
    setChecked(score);
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase.from("translation_attempts").insert({
        user_id: auth.user.id,
        sentence_id: current.id,
        user_answer: value,
        score,
      });
      await logActivity({ minutes: 2, xp: 5 });
    }
    toast[score >= 60 ? "success" : "message"](`Match score: ${score}%`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Hindi → English translation</h1>
        <p className="mt-1 text-muted-foreground">
          Think in Hindi, speak in English. Ten sentences a day is enough.
        </p>
      </header>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : current ? (
        <Card className="shadow-lift">
          <CardHeader>
            <CardTitle>
              Sentence {index + 1} of {rows.length}
            </CardTitle>
            <CardDescription>{current.hint ?? "Keep it natural and simple."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg bg-muted p-4 text-lg">{current.hindi}</p>
            <Input
              placeholder="Type the English translation"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {checked !== null ? (
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Model answer</p>
                <p className="text-sm font-medium">{current.english}</p>
                <p className="mt-1 text-sm text-success">Match score: {checked}%</p>
              </div>
            ) : null}
            <div className="flex gap-3">
              <Button onClick={check} disabled={!value.trim()}>
                Check answer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIndex((i) => (i + 1) % rows.length);
                  setValue("");
                  setChecked(null);
                }}
              >
                Next sentence
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">No sentences available yet.</p>
      )}
    </div>
  );
}
