import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Volume2, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { lessonsQuery } from "@/lib/queries";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/_authenticated/shadowing")({
  head: () => ({
    meta: [
      { title: "Shadowing Lab — CSE Professional English" },
      { name: "description", content: "Repeat native-style lines to fix rhythm, stress and fluency." },
      { property: "og:title", content: "Shadowing Lab" },
      { property: "og:description", content: "Slow, normal and fast shadowing drills." },
    ],
  }),
  component: ShadowingPage,
});

function ShadowingPage() {
  const { data, isLoading } = useQuery(lessonsQuery);
  const [rate, setRate] = useState(0.85);
  const lessons = (data ?? []).filter(
    (l) => Array.isArray(l.shadowing_lines) && (l.shadowing_lines as string[]).length > 0,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Shadowing lab</h1>
        <p className="mt-1 text-muted-foreground">
          Play a line, repeat it immediately, and match the rhythm — not just the words.
        </p>
      </header>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Playback speed</CardTitle>
          <CardDescription>Start slow, then build to natural pace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Slider
            min={0.6}
            max={1.2}
            step={0.05}
            value={[rate]}
            onValueChange={(v) => setRate(v[0] ?? 0.85)}
          />
          <p className="text-xs text-muted-foreground">{rate.toFixed(2)}× speed</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        lessons.map((l) => (
          <Card key={l.id} className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">
                Week {l.week_number} · Day {l.day_number}: {l.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(l.shadowing_lines as string[]).map((line) => (
                <div
                  key={line}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-4"
                >
                  <p className="text-sm leading-relaxed">{line}</p>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" aria-label="Play" onClick={() => speak(line, rate)}>
                      <Volume2 className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Repeat three times"
                      onClick={() => {
                        speak(line, rate);
                        setTimeout(() => speak(line, rate), 3500);
                        setTimeout(() => speak(line, rate), 7000);
                      }}
                    >
                      <Repeat className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
