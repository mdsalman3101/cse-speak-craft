import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { lessonsQuery } from "@/lib/queries";
import { progressQuery } from "@/lib/student";

export const Route = createFileRoute("/_authenticated/lessons")({
  head: () => ({
    meta: [
      { title: "Daily Lessons — CSE Professional English" },
      { name: "description", content: "All daily lessons in your 24-week roadmap." },
      { property: "og:title", content: "Daily Lessons" },
      { property: "og:description", content: "Week-by-week lessons with shadowing and speaking." },
    ],
  }),
  component: LessonsPage,
});

function LessonsPage() {
  const lessons = useQuery(lessonsQuery);
  const progress = useQuery(progressQuery);
  const rows = progress.data ?? [];

  const weeks = new Map<number, typeof lessons.data>();
  for (const l of lessons.data ?? []) {
    const list = weeks.get(l.week_number) ?? [];
    list.push(l);
    weeks.set(l.week_number, list);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Daily lessons</h1>
        <p className="mt-1 text-muted-foreground">
          Six sections per lesson, roughly one hour of focused practice.
        </p>
      </header>

      {lessons.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        [...weeks.entries()].map(([week, list]) => (
          <section key={week} className="space-y-3">
            <h2 className="font-display text-xl">Week {week}</h2>
            <div className="grid gap-3">
              {(list ?? []).map((l) => {
                const p = rows.find((r) => r.lesson_id === l.id);
                return (
                  <Link key={l.id} to="/lesson/$lessonId" params={{ lessonId: l.id }}>
                    <Card className="shadow-soft transition-shadow hover:shadow-lift">
                      <CardContent className="flex items-center gap-4 py-5">
                        {p?.completed ? (
                          <CheckCircle2 className="size-5 text-success" aria-hidden />
                        ) : (
                          <Circle className="size-5 text-muted-foreground" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Day {l.day_number} · {l.duration_minutes} min
                          </p>
                          <p className="font-display text-lg">{l.title}</p>
                          <p className="truncate text-sm text-muted-foreground">{l.description}</p>
                        </div>
                        {p && !p.completed && p.completion_percentage > 0 ? (
                          <Badge variant="secondary">{p.completion_percentage}%</Badge>
                        ) : null}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
