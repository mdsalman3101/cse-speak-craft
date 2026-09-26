import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Clock, Trophy, BookOpenCheck, ArrowRight, CalendarCheck, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { lessonsQuery, modulesQuery, TIERS } from "@/lib/queries";
import { activityQuery, computeStreak, progressQuery, profileQuery, todayISO } from "@/lib/student";

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

const PROGRAM_WEEKS = 24;

function Dashboard() {
  const lessons = useQuery(lessonsQuery);
  const modules = useQuery(modulesQuery);
  const progress = useQuery(progressQuery);
  const activity = useQuery(activityQuery);
  const profile = useQuery(profileQuery);

  const rows = progress.data ?? [];
  const completedIds = new Set(rows.filter((r) => r.completed).map((r) => r.lesson_id));
  const completed = completedIds.size;
  const total = lessons.data?.length ?? 0;
  const streak = computeStreak(activity.data ?? []);
  const totalMinutes = (activity.data ?? []).reduce((a, b) => a + b.minutes, 0);
  const xp = (activity.data ?? []).reduce((a, b) => a + b.xp, 0);

  // Weekly minutes vs goal
  const weeklyGoal = profile.data?.weekly_goal_minutes ?? 420;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartISO = weekStart.toISOString().slice(0, 10);
  const weekMinutes = (activity.data ?? [])
    .filter((a) => a.activity_date >= weekStartISO)
    .reduce((a, b) => a + b.minutes, 0);

  // Last 14 days streak calendar
  const activityByDate = new Map((activity.data ?? []).map((a) => [a.activity_date, a]));
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().slice(0, 10);
    return { iso, label: d.toLocaleDateString("en-IN", { weekday: "narrow" }), minutes: activityByDate.get(iso)?.minutes ?? 0 };
  });

  // Program progress: current week = furthest week with any progress, else 1
  const lessonById = new Map((lessons.data ?? []).map((l) => [l.id, l]));
  const currentWeek = Math.min(
    PROGRAM_WEEKS,
    Math.max(
      1,
      ...rows.map((r) => lessonById.get(r.lesson_id)?.week_number ?? 1),
    ),
  );
  const programPct = Math.round(((currentWeek - 1) / PROGRAM_WEEKS) * 100);

  // Per-tier completion
  const tierStats = TIERS.map((t) => {
    const tierModules = (modules.data ?? []).filter((m) => m.tier === t.tier);
    const moduleIds = new Set(tierModules.map((m) => m.id));
    const tierLessons = (lessons.data ?? []).filter((l) => l.module_id && moduleIds.has(l.module_id));
    const done = tierLessons.filter((l) => completedIds.has(l.id)).length;
    return { ...t, total: tierLessons.length, done };
  });

  const nextLesson =
    (lessons.data ?? []).find((l) => !completedIds.has(l.id)) ?? null;

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

      {/* Six-month program progress */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" /> Six-month program
          </CardTitle>
          <CardDescription>
            You are in week {currentWeek} of {PROGRAM_WEEKS} · {programPct}% of the journey complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Progress value={programPct} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Week 1</span>
              <span>Week {PROGRAM_WEEKS}</span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tierStats.map((t) => (
              <div key={t.tier} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t.name}</p>
                  <Badge variant="secondary" className="shrink-0">{t.weeks}</Badge>
                </div>
                <Progress
                  className="mt-3 h-2"
                  value={t.total ? (t.done / t.total) * 100 : 0}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.total === 0
                    ? "Lessons coming soon"
                    : `${t.done}/${t.total} lessons complete`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Streak calendar + weekly goal */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="size-5" /> Last 14 days
            </CardTitle>
            <CardDescription>Each filled day means you practised.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {last14.map((d) => (
                <div
                  key={d.iso}
                  title={`${d.iso}: ${d.minutes} min`}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 ${
                    d.minutes > 0
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  } ${d.iso === todayISO() ? "ring-2 ring-primary/50" : ""}`}
                >
                  <span className="text-[10px] uppercase">{d.label}</span>
                  <span className="text-xs font-semibold">{d.iso.slice(8)}</span>
                  {d.minutes > 0 && <Flame className="size-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>This week's goal</CardTitle>
            <CardDescription>
              {weekMinutes} of {weeklyGoal} minutes in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={Math.min(100, (weekMinutes / weeklyGoal) * 100)} />
            <p className="text-sm text-muted-foreground">
              {weekMinutes >= weeklyGoal
                ? "Goal reached — brilliant consistency!"
                : `${weeklyGoal - weekMinutes} minutes to go. One hour a day gets you there.`}
            </p>
            <Button variant="outline" asChild>
              <Link to="/profile">Adjust weekly goal</Link>
            </Button>
          </CardContent>
        </Card>
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
