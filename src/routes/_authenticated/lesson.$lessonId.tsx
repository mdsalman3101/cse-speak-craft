import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Volume2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { lessonQuery } from "@/lib/queries";
import { logActivity, saveLessonProgress, progressQuery } from "@/lib/student";
import { SpeakingRecorder } from "@/components/app/speaking-recorder";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lesson — CSE Professional English" },
      { name: "description", content: "Listening, shadowing, vocabulary, translation, speaking and quiz." },
      { property: "og:title", content: "Daily Lesson" },
      { property: "og:description", content: "Complete the six sections of today's lesson." },
    ],
  }),
  component: LessonPlayer,
});

const SECTIONS = [
  "listening",
  "shadowing",
  "vocabulary",
  "translation",
  "speaking",
  "quiz",
] as const;
type Section = (typeof SECTIONS)[number];

type Vocab = {
  id: string;
  word: string;
  pronunciation: string | null;
  part_of_speech: string | null;
  meaning: string;
  hindi_meaning: string;
  examples: string[] | null;
};
type Translation = { id: string; hindi: string; english: string; hint: string | null };
type Exercise = {
  id: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string | null;
  type: string;
};

function LessonPlayer() {
  const { lessonId } = Route.useParams();
  const { data, isLoading } = useQuery(lessonQuery(lessonId));
  const queryClient = useQueryClient();
  const [active, setActive] = useState<Section>("listening");
  const [done, setDone] = useState<Section[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const lesson = data?.lesson;
  const vocabulary = (data?.vocabulary ?? []) as unknown as Vocab[];
  const translations = (data?.translations ?? []) as unknown as Translation[];
  const exercises = (data?.exercises ?? []) as unknown as Exercise[];
  const shadowing = useMemo(
    () => (Array.isArray(lesson?.shadowing_lines) ? (lesson.shadowing_lines as string[]) : []),
    [lesson],
  );

  const quizScore = useMemo(() => {
    if (!exercises.length) return null;
    const correct = exercises.filter(
      (e) => (quizAnswers[e.id] ?? "").trim().toLowerCase() === e.answer.trim().toLowerCase(),
    ).length;
    return Math.round((correct / exercises.length) * 100);
  }, [exercises, quizAnswers]);

  async function completeSection(section: Section) {
    const next = done.includes(section) ? done : [...done, section];
    setDone(next);
    await saveLessonProgress({
      lessonId,
      sectionsDone: next,
      totalSections: SECTIONS.length,
      quizScore: quizSubmitted ? quizScore : null,
      minutes: next.length * 10,
    });
    await logActivity({ minutes: 10, xp: 20 });
    await queryClient.invalidateQueries({ queryKey: progressQuery.queryKey });
    const idx = SECTIONS.indexOf(section);
    if (idx < SECTIONS.length - 1) setActive(SECTIONS[idx + 1]!);
    else toast.success("Lesson complete. Great work!");
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-muted-foreground">This lesson could not be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/lessons">Back to lessons</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/lessons"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All lessons
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Week {lesson.week_number} · Day {lesson.day_number}
        </p>
        <h1 className="font-display text-3xl">{lesson.title}</h1>
        <p className="mt-2 text-muted-foreground">{lesson.objective ?? lesson.description}</p>
        <Progress className="mt-4" value={(done.length / SECTIONS.length) * 100} />
      </header>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActive(s)}
            className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
              active === s
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border hover:bg-accent"
            }`}
          >
            {done.includes(s) ? "✓ " : ""}
            {s}
          </button>
        ))}
      </div>

      {active === "listening" ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>1. Listening</CardTitle>
            <CardDescription>Listen twice, then read along once.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed">{lesson.listening_script}</p>
            <Button variant="outline" onClick={() => speak(lesson.listening_script ?? "")}>
              <Volume2 className="size-4" /> Play audio
            </Button>
            <div>
              <Button onClick={() => completeSection("listening")}>
                <Check className="size-4" /> Mark done
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {active === "shadowing" ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>2. Shadowing</CardTitle>
            <CardDescription>Repeat each line immediately after the audio, 3 times.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shadowing.map((line) => (
              <div
                key={line}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-4"
              >
                <p className="text-sm leading-relaxed">{line}</p>
                <Button size="icon" variant="ghost" aria-label="Play line" onClick={() => speak(line)}>
                  <Volume2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button onClick={() => completeSection("shadowing")}>
              <Check className="size-4" /> Mark done
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {active === "vocabulary" ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>3. Vocabulary</CardTitle>
            <CardDescription>Meaning, Hindi equivalent and example sentences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vocabulary.map((w) => (
              <div key={w.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-lg">{w.word}</span>
                  <span className="text-sm text-muted-foreground">{w.pronunciation}</span>
                  <Badge variant="outline">{w.part_of_speech}</Badge>
                  <Button size="icon" variant="ghost" aria-label="Pronounce" onClick={() => speak(w.word)}>
                    <Volume2 className="size-4" />
                  </Button>
                </div>
                <p className="mt-1 text-sm">{w.meaning}</p>
                <p className="text-sm text-muted-foreground">{w.hindi_meaning}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {(w.examples ?? []).map((ex) => (
                    <li key={ex}>{ex}</li>
                  ))}
                </ul>
              </div>
            ))}
            <Button onClick={() => completeSection("vocabulary")}>
              <Check className="size-4" /> Mark done
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {active === "translation" ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>4. Hindi → English translation</CardTitle>
            <CardDescription>Write your version first, then compare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {translations.map((t) => (
              <div key={t.id} className="rounded-lg border border-border p-4">
                <p className="text-sm">{t.hindi}</p>
                {t.hint ? <p className="mt-1 text-xs text-muted-foreground">Hint: {t.hint}</p> : null}
                <Input
                  className="mt-3"
                  placeholder="Your English translation"
                  value={attempts[t.id] ?? ""}
                  onChange={(e) => setAttempts((a) => ({ ...a, [t.id]: e.target.value }))}
                />
                {revealed[t.id] ? (
                  <p className="mt-2 text-sm font-medium text-success">{t.english}</p>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setRevealed((r) => ({ ...r, [t.id]: true }))}
                  >
                    Compare answer
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={() => completeSection("translation")}>
              <Check className="size-4" /> Mark done
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {active === "speaking" ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>5. Speaking</CardTitle>
            <CardDescription>{lesson.speaking_prompt}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SpeakingRecorder
              lessonId={lessonId}
              prompt={lesson.speaking_prompt ?? lesson.title}
              onSubmitted={() => completeSection("speaking")}
            />
          </CardContent>
        </Card>
      ) : null}

      {active === "quiz" ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>6. Quiz</CardTitle>
            <CardDescription>Check what stuck from today's lesson.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quiz for this lesson yet.</p>
            ) : (
              exercises.map((e, i) => {
                const chosen = quizAnswers[e.id];
                const correct = chosen?.trim().toLowerCase() === e.answer.trim().toLowerCase();
                return (
                  <div key={e.id} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-medium">
                      {i + 1}. {e.question}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {(e.options ?? []).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          disabled={quizSubmitted}
                          onClick={() => setQuizAnswers((a) => ({ ...a, [e.id]: opt }))}
                          className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                            chosen === opt ? "border-primary bg-accent" : "border-border hover:bg-accent"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {(e.options ?? []).length === 0 ? (
                        <Textarea
                          value={chosen ?? ""}
                          onChange={(ev) => setQuizAnswers((a) => ({ ...a, [e.id]: ev.target.value }))}
                          placeholder="Your answer"
                        />
                      ) : null}
                    </div>
                    {quizSubmitted ? (
                      <p className={`mt-2 text-sm ${correct ? "text-success" : "text-destructive"}`}>
                        {correct ? "Correct." : `Answer: ${e.answer}.`}{" "}
                        {e.explanation ? <span className="text-muted-foreground">{e.explanation}</span> : null}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
            {quizSubmitted ? (
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Score: {quizScore}%</Badge>
                <Button onClick={() => completeSection("quiz")}>
                  <Check className="size-4" /> Finish lesson
                </Button>
              </div>
            ) : (
              <Button onClick={() => setQuizSubmitted(true)} disabled={exercises.length === 0}>
                Submit quiz
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
