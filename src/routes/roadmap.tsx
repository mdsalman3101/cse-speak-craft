import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteLayout } from "@/components/site/site-layout";
import { modulesQuery, TIERS } from "@/lib/queries";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "6-Month Learning Roadmap — CSE Professional English" },
      {
        name: "description",
        content:
          "24 weeks across 6 tiers: foundation, communication, technical communication, professional communication, advanced English and mastery.",
      },
      { property: "og:title", content: "6-Month Learning Roadmap" },
      {
        property: "og:description",
        content: "See exactly what you learn each week of the CSE Professional English program.",
      },
    ],
  }),
  component: RoadmapPage,
});

const dailyPlan = [
  { label: "Listening", minutes: 10, detail: "Video or audio with English subtitles." },
  { label: "Shadowing", minutes: 15, detail: "Listen → pause → repeat, matching rhythm." },
  { label: "Vocabulary", minutes: 10, detail: "10 words × 3 example sentences." },
  { label: "Translation", minutes: 10, detail: "20 Hindi → English sentences." },
  { label: "Speaking", minutes: 10, detail: "Prompt-based speaking and recording." },
  { label: "Review", minutes: 5, detail: "Quick quiz and revision." },
];

function RoadmapPage() {
  const { data: modules, isLoading, isError } = useQuery(modulesQuery);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-semibold">The 6-month roadmap</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            You move in the natural order of language learning: listening → speaking → reading →
            writing → grammar. Grammar arrives only when it makes your communication clearer.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Your daily hour</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dailyPlan.map((block) => (
            <Card key={block.label} className="shadow-soft">
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <p className="font-semibold">{block.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{block.detail}</p>
                </div>
                <Badge variant="secondary">{block.minutes} min</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-2xl font-semibold">Tiers and modules</h2>
        {isError ? (
          <p className="mt-6 text-sm text-destructive">
            We couldn't load the roadmap right now. Please refresh the page.
          </p>
        ) : null}
        <div className="mt-6 space-y-8">
          {TIERS.map((tier) => (
            <div key={tier.tier}>
              <div className="flex flex-wrap items-center gap-3">
                <Badge>Tier {tier.tier}</Badge>
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <span className="text-sm text-muted-foreground">{tier.weeks}</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading
                  ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                  : (modules ?? [])
                      .filter((m) => m.tier === tier.tier)
                      .map((m) => (
                        <Card key={m.id} className="shadow-soft">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                              Module {m.number}: {m.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Weeks {m.week_start}–{m.week_end}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{m.description}</p>
                          </CardContent>
                        </Card>
                      ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-xl border border-border bg-card p-6 text-center shadow-soft">
          <p className="font-display text-xl">Week 1 is ready for you right now.</p>
          <Button asChild className="mt-4">
            <Link to="/auth">Start Week 1</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
