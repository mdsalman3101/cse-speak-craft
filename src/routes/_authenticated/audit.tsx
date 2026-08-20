import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShieldAlert, ScrollText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { communityProfilesQuery } from "@/lib/community";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — CSE Professional English" },
      {
        name: "description",
        content:
          "Traceability for mentors and admins: moderation actions, report resolutions and room membership changes.",
      },
      { property: "og:title", content: "Audit Log" },
      { property: "og:description", content: "Moderation and membership traceability for staff." },
    ],
  }),
  component: AuditPage,
});

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  category: string;
  target_type: string;
  target_id: string | null;
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

const CATEGORIES = [
  { value: "all", label: "All activity" },
  { value: "moderation", label: "Moderation actions" },
  { value: "report", label: "Report resolutions" },
  { value: "membership", label: "Room membership" },
] as const;

const categoryTone: Record<string, string> = {
  moderation: "bg-destructive/10 text-destructive",
  report: "bg-primary/10 text-primary",
  membership: "bg-muted text-muted-foreground",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AuditPage() {
  const { hasRole, loading } = useAuth();
  const isStaff = hasRole("mentor") || hasRole("admin");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const auditQuery = useQuery({
    queryKey: ["audit-log"],
    enabled: isStaff,
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as AuditRow[];
    },
  });

  const profiles = useQuery({ ...communityProfilesQuery, enabled: isStaff });

  const rows = useMemo(() => {
    const all = auditQuery.data ?? [];
    const term = search.trim().toLowerCase();
    return all.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (!term) return true;
      return (
        r.summary.toLowerCase().includes(term) ||
        r.action.toLowerCase().includes(term) ||
        (r.target_id ?? "").toLowerCase().includes(term)
      );
    });
  }, [auditQuery.data, category, search]);

  const counts = useMemo(() => {
    const all = auditQuery.data ?? [];
    return {
      moderation: all.filter((r) => r.category === "moderation").length,
      report: all.filter((r) => r.category === "report").length,
      membership: all.filter((r) => r.category === "membership").length,
    };
  }, [auditQuery.data]);

  function actorName(id: string | null) {
    if (!id) return "System";
    return profiles.data?.[id]?.name ?? `${id.slice(0, 8)}…`;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5" aria-hidden /> Staff only
            </CardTitle>
            <CardDescription>
              The audit log is available to mentors and admins. Ask your mentor if you need a record
              of a moderation decision.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 font-display text-2xl">
          <ScrollText className="size-6" aria-hidden /> Audit log
        </h1>
        <p className="text-sm text-muted-foreground">
          Every moderation action, report resolution and room membership change, newest first.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["moderation", "report", "membership"] as const).map((key) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardDescription className="capitalize">{key} events</CardDescription>
              <CardTitle className="text-2xl">{counts[key]}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label htmlFor="audit-search">Search</Label>
            <Input
              id="audit-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search summary, action or target id"
              className="sm:w-72"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="audit-category" className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditQuery.isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : auditQuery.isError ? (
            <p className="text-sm text-destructive">
              Could not load the audit log. Refresh and try again.
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries match this filter yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={categoryTone[r.category] ?? ""} variant="secondary">
                      {r.category}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">{r.action}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatWhen(r.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{r.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    By {actorName(r.actor_id)} · {r.target_type}
                    {r.target_id ? ` · ${r.target_id.slice(0, 8)}…` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
