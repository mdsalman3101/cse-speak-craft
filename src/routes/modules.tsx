import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteLayout } from "@/components/site/site-layout";
import { modulesQuery, lessonsQuery } from "@/lib/queries";

export const Route = createFileRoute("/modules")({
  head: () => ({
    meta: [
      { title: "All 17 Modules — CSE Professional English" },
      {
        name: "description",
        content:
          "Browse every module: self introduction, email writing, coding discussion, group discussion, interviews, LinkedIn, resume and public speaking.",
      },
      { property: "og:title", content: "All 17 Modules" },
      {
        property: "og:description",
        content: "From self introduction to public speaking — the full module list.",
      },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const { data: modules, isLoading } = useQuery(modulesQuery);
  const { data: lessons = [] } = useQuery(lessonsQuery);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<number | null>(null);

  const filtered = (modules ?? []).filter((m) => {
    const matchesSearch = `${m.title} ${m.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tier === null || m.tier === tier;
    return matchesSearch && matchesTier;
  });

  return (
    <SiteLayout>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-semibold">Modules</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            17 modules covering everything a CSE student needs to communicate at college and at
            work.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules…"
            aria-label="Search modules"
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={tier === null ? "default" : "outline"}
              size="sm"
              onClick={() => setTier(null)}
            >
              All tiers
            </Button>
            {[1, 2, 3, 4, 5, 6].map((t) => (
              <Button
                key={t}
                variant={tier === t ? "default" : "outline"}
                size="sm"
                onClick={() => setTier(t)}
              >
                Tier {t}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)
            : filtered.map((m) => {
                const count = lessons.filter((l) => l.module_id === m.id).length;
                return (
                  <Card key={m.id} className="flex flex-col shadow-soft">
                    <CardHeader className="pb-2">
                      <Badge variant="secondary" className="w-fit">
                        {m.tier_name}
                      </Badge>
                      <CardTitle className="text-base">
                        Module {m.number}: {m.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-4">
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Weeks {m.week_start}–{m.week_end} ·{" "}
                        {count > 0 ? `${count} lessons published` : "Lessons coming soon"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No modules match your search.
          </p>
        ) : null}

        <div className="mt-12 text-center">
          <Button asChild>
            <Link to="/trial">Try a free lesson</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
