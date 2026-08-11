import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Clock, Trophy, BookOpenCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { lessonsQuery } from "@/lib/queries";
import { activityQuery, computeStreak, progressQuery, profileQuery } from "@/lib/student";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CSE Professional English" },
      { name: "description", content: "Your streak, daily plan and lesson progress." },
      { property: "og:title", content: "Student Dashboard" },
      { property: "og:description", content: "Track your daily one-hour English practice." },
    ],
  }),
  component: Dashboard,
});

const DAILY_PLAN = [
  { label: "Listening", minutes: 10 },
  { label: "Shadowing", minutes: 15 },
  { label: "Vocabulary", minutes: 10 },
  { label: "Translation", minutes: 10 },
  { label: "Speaking", minutes: 10 },
  { label: "Writing / Quiz", minutes: 5 },
];

function Dashboard() {
  const lessons = useQuery(lessonsQuery);
  const progress = useQuery(progressQuery);
  const activity = useQuery(activityQuery);
  const profile = useQuery(profileQuery);

  const rows = progress.data ?? [];
  const completed = rows.filter((r) => r.completed).length;
  const total = lessons.data?.length ?? 0;
  const streak = computeStreak(activity.data ?? []);
  const totalMinutes = (activity.data ?? []).reduce((a, b) => a + b.minutes, 0);
  const xp = (activity.data ?? []).reduce((a, b) => a + b.xp, 0);

  const nextLesson =
    (lessons.data ?? []).find((l) => !rows.some((r) => r.lesson_id === l.id && r.completed)) ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">
          Welcome back{profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          One focused hour today keeps your streak alive.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Flame className="size-5" />} label="Day streak" value={`${streak}`} />
        <StatCard
          icon={<Clock className="size-5" />}
          label="Minutes practised"
          value={`${totalMinutes}`}
        />
        <StatCard
          icon={<BookOpenCheck className="size-5" />}
          label="Lessons done"
          value={`${completed}/${total}`}
        />
        <StatCard icon={<Trophy className="size-5" />} label="XP earned" value={`${xp}`} />
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Today's 60-minute plan</CardTitle>
          <CardDescription>Listening → Speaking → Reading → Writing → Grammar</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DAILY_PLAN.map((t) => (
            <div
              key={t.label}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <span className="text-sm font-medium">{t.label}</span>
              <Badge variant="secondary">{t.minutes} min</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Continue your roadmap</CardTitle>
          <CardDescription>
            {total > 0 ? `${Math.round((completed / total) * 100)}% of published lessons complete` : "Loading lessons"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={total ? (completed / total) * 100 : 0} />
          {lessons.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : nextLesson ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Week {nextLesson.week_number} · Day {nextLesson.day_number}
                </p>
                <p className="font-display text-lg">{nextLesson.title}</p>
                <p className="text-sm text-muted-foreground">{nextLesson.description}</p>
              </div>
              <Button asChild>
                <Link to="/lesson/$lessonId" params={{ lessonId: nextLesson.id }}>
                  Start lesson <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              All published lessons are complete. More weeks are being added.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-center gap-4 py-6">
        <span className="surface-accent flex size-10 items-center justify-center rounded-xl">
          {icon}
        </span>
        <div>
          <p className="font-display text-2xl leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
