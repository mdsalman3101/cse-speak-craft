import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lessonsQuery } from "@/lib/queries";
import { activityQuery, computeStreak, profileQuery, progressQuery } from "@/lib/student";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — CSE Professional English" },
      {
        name: "description",
        content: "Edit your learning goals, current level and weekly target, and track program progress.",
      },
      { property: "og:title", content: "Your learning profile" },
      { property: "og:description", content: "Goals, level and 24-week program progress in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const LEVELS = [
  { value: "beginner", label: "Beginner — building basic fluency" },
  { value: "intermediate", label: "Intermediate — conversational, needs polish" },
  { value: "advanced", label: "Advanced — refining professional tone" },
];

type Form = {
  full_name: string;
  college: string;
  branch: string;
  year_of_study: string;
  target_role: string;
  bio: string;
  learning_goals: string;
  current_level: string;
  weekly_goal_minutes: string;
};

const EMPTY: Form = {
  full_name: "",
  college: "",
  branch: "",
  year_of_study: "",
  target_role: "",
  bio: "",
  learning_goals: "",
  current_level: "beginner",
  weekly_goal_minutes: "300",
};

function ProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery);
  const lessons = useQuery(lessonsQuery);
  const progress = useQuery(progressQuery);
  const activity = useQuery(activityQuery);

  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    const p = profile.data as Record<string, unknown> | null | undefined;
    if (!p) return;
    setForm({
      full_name: (p['full_name'] as string) ?? "",
      college: (p['college'] as string) ?? "",
      branch: (p['branch'] as string) ?? "",
      year_of_study: p['year_of_study'] ? String(p['year_of_study']) : "",
      target_role: (p['target_role'] as string) ?? "",
      bio: (p['bio'] as string) ?? "",
      learning_goals: (p['learning_goals'] as string) ?? "",
      current_level: (p['current_level'] as string) || "beginner",
      weekly_goal_minutes: p['weekly_goal_minutes'] ? String(p['weekly_goal_minutes']) : "300",
    });
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");
      const year = Number.parseInt(form.year_of_study, 10);
      const weekly = Number.parseInt(form.weekly_goal_minutes, 10);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || "Student",
          college: form.college.trim() || null,
          branch: form.branch.trim() || null,
          year_of_study: Number.isFinite(year) ? year : null,
          target_role: form.target_role.trim() || null,
          bio: form.bio.trim() || null,
          learning_goals: form.learning_goals.trim(),
          current_level: form.current_level,
          weekly_goal_minutes: Number.isFinite(weekly) ? Math.max(30, weekly) : 300,
        } as never)
        .eq("id", uid);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await queryClient.invalidateQueries({ queryKey: profileQuery.queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = progress.data ?? [];
  const completed = rows.filter((r) => r.completed).length;
  const total = lessons.data?.length ?? 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const streak = computeStreak(activity.data ?? []);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekISO = weekStart.toISOString().slice(0, 10);
  const weekMinutes = (activity.data ?? [])
    .filter((a) => a.activity_date >= weekISO)
    .reduce((a, b) => a + b.minutes, 0);
  const weeklyTarget = Math.max(30, Number.parseInt(form.weekly_goal_minutes, 10) || 300);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Keep your goals current — your plan and progress are measured against them.
        </p>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Program progress</CardTitle>
          <CardDescription>How far you are through the 24-week roadmap.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {progress.isLoading || lessons.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lessons completed</span>
                  <span className="font-medium">
                    {completed}/{total} · {pct}%
                  </span>
                </div>
                <Progress value={pct} />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">This week's practice</span>
                  <span className="font-medium">
                    {weekMinutes}/{weeklyTarget} min
                  </span>
                </div>
                <Progress value={Math.min(100, (weekMinutes / weeklyTarget) * 100)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{streak} day streak</Badge>
                <Badge variant="secondary">Level: {form.current_level}</Badge>
                {form.target_role ? <Badge variant="secondary">Goal role: {form.target_role}</Badge> : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Learning goals & level</CardTitle>
          <CardDescription>Editable any time as you improve.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="goals">Learning goals</Label>
            <Textarea
              id="goals"
              rows={4}
              placeholder="e.g. Speak confidently in stand-ups and clear HR + technical interview rounds by December."
              value={form.learning_goals}
              onChange={(e) => setForm((f) => ({ ...f, learning_goals: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="level">Current level</Label>
              <Select
                value={form.current_level}
                onValueChange={(v) => setForm((f) => ({ ...f, current_level: v }))}
              >
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly">Weekly practice target (minutes)</Label>
              <Input
                id="weekly"
                type="number"
                min={30}
                step={30}
                value={form.weekly_goal_minutes}
                onChange={(e) => setForm((f) => ({ ...f, weekly_goal_minutes: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>About you</CardTitle>
          <CardDescription>Used across community posts and certificates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="full_name" label="Full name" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
            <Field id="target_role" label="Target role" value={form.target_role} onChange={(v) => setForm((f) => ({ ...f, target_role: v }))} />
            <Field id="college" label="College" value={form.college} onChange={(v) => setForm((f) => ({ ...f, college: v }))} />
            <Field id="branch" label="Branch" value={form.branch} onChange={(v) => setForm((f) => ({ ...f, branch: v }))} />
            <Field
              id="year_of_study"
              label="Year of study"
              type="number"
              value={form.year_of_study}
              onChange={(v) => setForm((f) => ({ ...f, year_of_study: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
