import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Mic,
  Languages,
  BookOpen,
  Mail,
  Code,
  Presentation,
  Users,
  LineChart,
  Headphones,
  Briefcase,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { modulesQuery, TIERS } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CSE Professional English — Speak English, Grow Your Tech Career" },
      {
        name: "description",
        content:
          "A practical 6-month English program for CSE and IT students: daily speaking, shadowing, vocabulary, translation, interviews and professional writing.",
      },
      { property: "og:title", content: "CSE Professional English" },
      {
        property: "og:description",
        content:
          "Speak English. Think like a professional. Build your CSE career with 1 hour of practice a day.",
      },
    ],
  }),
  component: Landing,
});

const whyItems = [
  { title: "Practical English", body: "No grammar drills first. You learn what you actually need to say." },
  { title: "CSE-specific communication", body: "Explain code, projects, bugs and technical decisions clearly." },
  { title: "Daily 1-hour learning", body: "Six focused blocks a day. Consistency beats intensity." },
  { title: "Real-world scenarios", body: "Standups, client calls, professor emails, HR interviews." },
  { title: "Speaking-first approach", body: "You speak from Day 1 — mirror, prompts and recordings." },
  { title: "Hindi + English support", body: "Hindi meanings and translation practice inside every lesson." },
];

const features = [
  { icon: Headphones, title: "Daily Lessons", body: "Listening, shadowing, vocabulary, translation, speaking, review." },
  { icon: Mic, title: "Speaking Practice", body: "Prompts, recording, playback and structured feedback." },
  { icon: BookOpen, title: "Vocabulary", body: "10 words a day, each with 3 practical example sentences." },
  { icon: Languages, title: "Translation", body: "20 Hindi → English sentences daily from real situations." },
  { icon: Briefcase, title: "Interview Preparation", body: "HR, behavioural and technical answers you can rehearse." },
  { icon: Mail, title: "Email Writing", body: "Templates and practice for professors, clients and recruiters." },
  { icon: Code, title: "Coding Communication", body: "Explain algorithms, bugs and design decisions in English." },
  { icon: Presentation, title: "Presentation", body: "Open, transition, handle questions and close with confidence." },
  { icon: Users, title: "Community", body: "Peer practice, mentor Q&A and weekly live sessions." },
  { icon: LineChart, title: "Progress Tracking", body: "Streaks, speaking score, words learned and weekly activity." },
];

const steps = ["Learn", "Practice", "Speak", "Get Feedback", "Improve"];

function Landing() {
  const { data: modules = [] } = useQuery(modulesQuery);

  return (
    <div>
      <section className="surface-hero">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <Badge className="border-0 bg-white/15 text-ink-foreground hover:bg-white/20">
              6-month program · 1 hour a day
            </Badge>
            <h1 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
              Speak English. Think Like a Professional. Build Your CSE Career.
            </h1>
            <p className="mt-5 max-w-xl text-base text-ink-foreground/80 sm:text-lg">
              A practical 6-month English learning program designed specifically for CSE and IT
              students — interviews, coding discussions, emails, meetings and presentations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Start Learning <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
              >
                <Link to="/roadmap">Explore Roadmap</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-ink-foreground/70">
              Prefer to try first?{" "}
              <Link to="/trial" className="underline underline-offset-4">
                Take a free trial lesson
              </Link>
            </p>
          </div>

          <Card className="border-0 shadow-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Example student dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <span className="text-sm font-medium">Current streak</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-streak-foreground">
                  <Flame className="size-4 text-streak" aria-hidden /> 12 days
                </span>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall progress</span>
                  <span className="font-medium">42%</span>
                </div>
                <Progress value={42} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Speaking score</p>
                  <p className="font-display text-2xl">72<span className="text-sm text-muted-foreground">/100</span></p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Vocabulary</p>
                  <p className="font-display text-2xl">245 <span className="text-sm text-muted-foreground">words</span></p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Illustrative figures shown for preview purposes.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-semibold">Why this platform?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whyItems.map((item) => (
            <Card key={item.title} className="shadow-soft">
              <CardContent className="pt-6">
                <CheckCircle2 className="size-5 text-success" aria-hidden />
                <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-5">
            {steps.map((step, i) => (
              <li key={step} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
                <p className="font-display text-lg">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">The 6-month roadmap</h2>
            <p className="mt-2 text-muted-foreground">
              24 weeks, 6 tiers, 17 modules — from self introduction to public speaking.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/roadmap">See full roadmap</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const tierModules = modules.filter((m) => m.tier === tier.tier);
            return (
              <Card key={tier.tier} className="shadow-soft">
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit">
                    Tier {tier.tier} · {tier.weeks}
                  </Badge>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {tierModules.length === 0 ? (
                      <li>Modules loading…</li>
                    ) : (
                      tierModules.map((m) => (
                        <li key={m.id}>
                          {m.number}. {m.title}
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-semibold">Everything in one place</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="shadow-soft">
                <CardContent className="pt-6">
                  <span className="surface-accent flex size-9 items-center justify-center rounded-lg">
                    <f.icon className="size-4" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-semibold">Student stories</h2>
        <p className="mt-2 text-muted-foreground">
          Placeholder cards — real student testimonials will replace these once the first cohort
          finishes.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-dashed shadow-none">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground italic">
                  Testimonial placeholder {i} — reserved for a verified student review.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-muted" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">Student name</p>
                    <p className="text-xs text-muted-foreground">CSE, batch year</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="surface-hero">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Your English Should Not Limit Your Career.
          </h2>
          <p className="mt-4 text-ink-foreground/80">
            One hour a day for six months. Start with Week 1, Day 1 — self introduction.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/auth">
              Start Your 6-Month Journey <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
