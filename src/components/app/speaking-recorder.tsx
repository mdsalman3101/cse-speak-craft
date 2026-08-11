import { useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, Square, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/student";

type Props = {
  lessonId?: string;
  prompt: string;
  onSubmitted?: () => void;
};

export function SpeakingRecorder({ lessonId, prompt, onSubmitted }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access was blocked. You can still submit written notes.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  async function submit() {
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("speaking_submissions").insert({
      user_id: uid,
      lesson_id: lessonId ?? null,
      prompt,
      transcript: notes || null,
      duration_seconds: seconds,
      status: "submitted",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity({ minutes: 10, xp: 25 });
    toast.success("Speaking practice submitted for review.");
    setNotes("");
    setAudioUrl(null);
    setSeconds(0);
    onSubmitted?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
        {recording ? (
          <Button variant="destructive" onClick={stop}>
            <Square className="size-4" /> Stop
          </Button>
        ) : (
          <Button onClick={start}>
            <Mic className="size-4" /> Record
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
        </span>
        {audioUrl ? <audio controls src={audioUrl} className="ml-auto" /> : null}
      </div>

      <Textarea
        rows={5}
        placeholder="Type what you said (self-transcript). This helps mentors give feedback."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <Button onClick={submit} disabled={busy || (!notes && seconds === 0)}>
        <Send className="size-4" /> {busy ? "Submitting…" : "Submit practice"}
      </Button>
    </div>
  );
}
