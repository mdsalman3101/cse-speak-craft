import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/site-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Program — CSE Professional English" },
      {
        name: "description",
        content:
          "Our learning philosophy: speaking first, consistency over intensity, sentences over isolated words, and mistakes as progress.",
      },
      { property: "og:title", content: "About CSE Professional English" },
      {
        property: "og:description",
        content: "The 10 principles behind a speaking-first English program for CSE students.",
      },
    ],
  }),
  component: AboutPage,
});

const principles = [
  ["Grammar comes later", "Listening → Speaking → Reading → Writing → Grammar. Grammar shows up when it helps you communicate."],
  ["Consistency over intensity", "One focused hour every day beats five hours once a week. Streaks keep you honest."],
  ["English is a language, not a subject", "You learn Java by coding. You learn English by speaking."],
  ["Mistakes are progress", "Day 1 many mistakes, Day 15 fewer, Day 30 more confidence. Feedback is always constructive."],
  ["Daily translation practice", "20 Hindi → English sentences a day, taken from real college and office situations."],
  ["Shadowing technique", "15 minutes daily: listen, pause, repeat, match the rhythm."],
  ["Learn sentences, not words", "Not 'create = बनाना', but 'I want to create a website.'"],
  ["10 words × 3 sentences", "Ten new words a day, each with three practical examples."],
  ["Think in English", "Narrate your day in English: 'I am opening my laptop. I am fixing a bug.'"],
  ["Speak every day", "Mirror talk, self-talk, prompts, peer practice, mentor practice, recordings."],
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-semibold">Built for CSE students, not for exams</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            This is a practical English program for 2nd year onwards: interviews, coding
            discussions, presentations, emails, meetings, LinkedIn, resumes, client communication
            and public speaking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Our 10 learning principles</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {principles.map(([title, body], i) => (
            <Card key={title} className="shadow-soft">
              <CardContent className="pt-6">
                <span className="text-xs font-medium text-muted-foreground">Rule {i + 1}</span>
                <h3 className="mt-1 text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="surface-hero rounded-2xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold">Six months. One hour a day.</h2>
          <p className="mt-2 text-ink-foreground/80">
            Week 1 starts with your self introduction — the sentence you will use most often.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth">Create your free account</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
