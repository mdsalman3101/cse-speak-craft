import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SiteLayout } from "@/components/site/site-layout";
import { resourcesQuery } from "@/lib/queries";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources Library — Email Templates, Interview Q&A, GD Topics" },
      {
        name: "description",
        content:
          "Searchable library of professional email templates, interview answers, group discussion topics, presentation phrases and workplace English.",
      },
      { property: "og:title", content: "Resources Library" },
      {
        property: "og:description",
        content: "Email templates, interview answers, GD topics and workplace phrases for CSE students.",
      },
    ],
  }),
  component: ResourcesPage,
});

type ResourceRow = {
  id: string;
  title: string;
  type: string;
  category: string;
  content: string;
  difficulty: string;
};

const categories = ["all", "emails", "interview", "gd", "presentation", "professional"];

function ResourcesPage() {
  const { data, isLoading, isError } = useQuery(resourcesQuery);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const resources = (data ?? []) as ResourceRow[];
  const filtered = resources.filter((r) => {
    const s = `${r.title} ${r.content}`.toLowerCase().includes(search.toLowerCase());
    const c = category === "all" || r.category === category;
    const d = difficulty === "all" || r.difficulty === difficulty;
    return s && c && d;
  });

  return (
    <SiteLayout>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-semibold">Resources library</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Templates and guides you can copy, adapt and use today — emails, interview answers,
            GD phrases, presentation lines and workplace English.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
            aria-label="Search resources"
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={category === c ? "default" : "outline"}
                onClick={() => setCategory(c)}
              >
                {c === "all" ? "All categories" : c}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "beginner", "intermediate", "advanced"].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={difficulty === d ? "secondary" : "ghost"}
                onClick={() => setDifficulty(d)}
              >
                {d === "all" ? "Any level" : d}
              </Button>
            ))}
          </div>
        </div>

        {isError ? (
          <p className="mt-8 text-sm text-destructive">
            We couldn't load the resources. Please refresh the page.
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)
            : filtered.map((r) => (
                <Card key={r.id} className="flex flex-col shadow-soft">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{r.category}</Badge>
                      <Badge variant="outline">{r.difficulty}</Badge>
                    </div>
                    <CardTitle className="text-base">{r.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    <p className="line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">
                      {r.content}
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-fit">
                          Open
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{r.title}</DialogTitle>
                          <DialogDescription>
                            {r.category} · {r.difficulty}
                          </DialogDescription>
                        </DialogHeader>
                        <pre className="font-sans text-sm whitespace-pre-wrap">{r.content}</pre>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No resources match these filters yet.
          </p>
        ) : null}
      </section>
    </SiteLayout>
  );
}
