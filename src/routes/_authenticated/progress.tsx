import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { lessonsQuery, TIERS } from "@/lib/queries";
import { activityQuery, badgesQuery, computeStreak, progressQuery } from "@/lib/student";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Your Progress — CSE Professional English" },
      { name: "description", content: "Streaks, weekly minutes, skill balance and earned badges." },
      { property: "og:title", content: "Your Progress" },
      { property: "og:description", content: "See how your daily practice adds up." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const activity = useQuery(activityQuery);
  const progress = useQuery(progressQuery);
  const lessons = useQuery(lessonsQuery);
  const badges = useQuery(badgesQuery);

  const rows = activity.data ?? [];
  const streak = computeStreak(rows);
  const last14 = [...rows].slice(0, 14).reverse();
  const maxMinutes = Math.max(60, ...last14.map((r) => r.minutes));
  const completed = (progress.data ?? []).filter((p) => p.completed).length;
  const total = lessons.data?.length ?? 0;
  const earnedCodes = new Set(
    ((badges.data?.earned ?? []) as unknown as { badge_code: string }[]).map((b) => b.badge_code),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Your progress</h1>
        <p className="mt-1 text-muted-foreground">Consistency beats intensity. Keep the streak alive.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-soft">
          <CardContent className="py-6">
            <p className="font-display text-3xl">{streak}</p>
            <p className="text-xs text-muted-foreground">Day streak</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="py-6">
            <p className="font-display text-3xl">{rows.reduce((a, b) => a + b.minutes, 0)}</p>
            <p className="text-xs text-muted-foreground">Total minutes</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="py-6">
            <p className="font-display text-3xl">
              {completed}/{total}
            </p>
            <p className="text-xs text-muted-foreground">Lessons complete</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Last 14 days</CardTitle>
          <CardDescription>Minutes practised per day</CardDescription>
        </CardHeader>
        <CardContent>
          {last14.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete a lesson to start your chart.</p>
          ) : (
            <div className="flex h-40 items-end gap-2">
              {last14.map((d) => (
                <div key={d.activity_date} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{ height: `${(d.minutes / maxMinutes) * 100}%` }}
                    title={`${d.minutes} min`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {d.activity_date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Roadmap completion</CardTitle>
          <CardDescription>Six tiers over 24 weeks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={total ? (completed / total) * 100 : 0} />
          <div className="grid gap-2 sm:grid-cols-2">
            {TIERS.map((t) => (
              <div key={t.tier} className="rounded-lg border border-border px-4 py-3 text-sm">
                <span className="font-medium">
                  Tier {t.tier}: {t.name}
                </span>
                <span className="block text-xs text-muted-foreground">{t.weeks}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Earn them by showing up daily.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {(badges.data?.all ?? []).map((b: Record<string, unknown>) => {
            const earned = earnedCodes.has(String(b["code"]));
            return (
              <div
                key={String(b["id"])}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  earned ? "border-transparent bg-accent" : "border-dashed border-border opacity-60"
                }`}
              >
                <p className="font-medium">{String(b["title"])}</p>
                <p className="text-xs text-muted-foreground">{String(b["description"])}</p>
                {earned ? (
                  <Badge className="mt-2" variant="secondary">
                    Earned
                  </Badge>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
