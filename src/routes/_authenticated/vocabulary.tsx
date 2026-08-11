import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Volume2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { vocabularyQuery } from "@/lib/queries";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/_authenticated/vocabulary")({
  head: () => ({
    meta: [
      { title: "Vocabulary Builder — CSE Professional English" },
      { name: "description", content: "Flashcards with Hindi meanings, pronunciation and examples." },
      { property: "og:title", content: "Vocabulary Builder" },
      { property: "og:description", content: "Learn workplace and technical vocabulary daily." },
    ],
  }),
  component: VocabularyPage,
});

type Vocab = {
  id: string;
  word: string;
  pronunciation: string | null;
  part_of_speech: string | null;
  meaning: string;
  hindi_meaning: string;
  examples: string[] | null;
  category: string | null;
};

function VocabularyPage() {
  const { data, isLoading } = useQuery(vocabularyQuery);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const words = (data ?? []) as unknown as Vocab[];
  const filtered = useMemo(
    () =>
      words.filter((w) =>
        [w.word, w.meaning, w.hindi_meaning].join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [words, query],
  );
  const card = filtered[index % Math.max(filtered.length, 1)];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl">Vocabulary builder</h1>
        <p className="mt-1 text-muted-foreground">
          Flip the card, say the word aloud, then use it in your own sentence.
        </p>
      </header>

      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : card ? (
        <Card
          className="cursor-pointer shadow-lift"
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
        >
          <CardContent className="min-h-56 space-y-3 py-10 text-center">
            {flipped ? (
              <>
                <p className="text-lg">{card.meaning}</p>
                <p className="text-muted-foreground">{card.hindi_meaning}</p>
                <ul className="mx-auto max-w-md list-disc space-y-1 pl-5 text-left text-sm text-muted-foreground">
                  {(card.examples ?? []).map((ex) => (
                    <li key={ex}>{ex}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="font-display text-4xl">{card.word}</p>
                <p className="text-sm text-muted-foreground">{card.pronunciation}</p>
                <Badge variant="outline">{card.part_of_speech}</Badge>
                <p className="text-xs text-muted-foreground">Tap to reveal meaning</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">No words match your search.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setFlipped(false);
            setIndex((i) => (i + 1) % Math.max(filtered.length, 1));
          }}
        >
          Next word
        </Button>
        <Button variant="ghost" onClick={() => card && speak(card.word)}>
          <Volume2 className="size-4" /> Pronounce
        </Button>
        <Button variant="ghost" onClick={() => setFlipped(false)}>
          <RotateCcw className="size-4" /> Reset card
        </Button>
        <Input
          className="ml-auto max-w-xs"
          placeholder="Search words"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
            setFlipped(false);
          }}
        />
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {filtered.slice(0, 40).map((w) => (
          <Card key={w.id} className="shadow-soft">
            <CardContent className="py-4">
              <p className="font-display text-lg">{w.word}</p>
              <p className="text-sm">{w.meaning}</p>
              <p className="text-sm text-muted-foreground">{w.hindi_meaning}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
