export interface Sentence {
  text: string;
  start: number;
  end: number;
}

/** Splits text into sentence-ish chunks, keeping character offsets into the original text. */
export function splitIntoSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  const re = /[^.!?\n]+[.!?]+(\s+|$)|[^.!?\n]+$/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const start = match.index + raw.indexOf(trimmed);
    sentences.push({ text: trimmed, start, end: start + trimmed.length });
  }
  return sentences.length ? sentences : [{ text, start: 0, end: text.length }];
}

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      resolve([]);
      return;
    }
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const onChange = () => {
      synth.removeEventListener("voiceschanged", onChange);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", onChange);
    // Some browsers never fire voiceschanged if voices were already cached.
    setTimeout(() => resolve(synth.getVoices()), 1000);
  });
}

export type ReaderStatus = "idle" | "playing" | "paused" | "ended";

export interface SpeechReaderCallbacks {
  onStatusChange?: (status: ReaderStatus) => void;
  onSentenceStart?: (index: number) => void;
  onWordBoundary?: (sentenceIndex: number, charIndexInSentence: number) => void;
  onError?: (message: string) => void;
}

export interface SpeakOptions {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  startAt?: number;
}

/** Drives window.speechSynthesis sentence-by-sentence so playback can be paused,
 * resumed, or restarted from an arbitrary sentence, and so the UI can highlight
 * the sentence/word currently being spoken. */
export class SpeechReader {
  private sentences: Sentence[] = [];
  private currentIndex = 0;
  private status: ReaderStatus = "idle";
  private callbacks: SpeechReaderCallbacks;
  private options: SpeakOptions = { voice: null, rate: 1, pitch: 1 };
  private stopped = true;

  constructor(callbacks: SpeechReaderCallbacks = {}) {
    this.callbacks = callbacks;
  }

  get isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  loadText(text: string): Sentence[] {
    this.sentences = splitIntoSentences(text);
    return this.sentences;
  }

  getSentences(): Sentence[] {
    return this.sentences;
  }

  private setStatus(status: ReaderStatus) {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  play(options: SpeakOptions) {
    if (!this.isSupported) {
      this.callbacks.onError?.("Speech synthesis isn't supported in this browser.");
      return;
    }
    this.options = options;
    this.currentIndex = options.startAt ?? 0;
    this.stopped = false;
    window.speechSynthesis.cancel();
    this.speakCurrent();
  }

  private speakCurrent() {
    if (this.stopped) return;
    if (this.currentIndex >= this.sentences.length) {
      this.setStatus("ended");
      return;
    }
    const sentence = this.sentences[this.currentIndex];
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    utterance.rate = this.options.rate;
    utterance.pitch = this.options.pitch;
    if (this.options.voice) utterance.voice = this.options.voice;

    utterance.onstart = () => {
      this.setStatus("playing");
      this.callbacks.onSentenceStart?.(this.currentIndex);
    };
    utterance.onboundary = (event) => {
      if (event.name === "word" || event.name === undefined) {
        this.callbacks.onWordBoundary?.(this.currentIndex, event.charIndex);
      }
    };
    utterance.onend = () => {
      if (this.stopped) return;
      this.currentIndex += 1;
      this.speakCurrent();
    };
    utterance.onerror = (event) => {
      if (this.stopped) return;
      if (event.error === "interrupted" || event.error === "canceled") return;
      this.callbacks.onError?.(`Speech error: ${event.error}`);
    };

    window.speechSynthesis.speak(utterance);
  }

  pause() {
    if (!this.isSupported) return;
    window.speechSynthesis.pause();
    this.setStatus("paused");
  }

  resume() {
    if (!this.isSupported) return;
    window.speechSynthesis.resume();
    this.setStatus("playing");
  }

  stop() {
    this.stopped = true;
    if (this.isSupported) window.speechSynthesis.cancel();
    this.currentIndex = 0;
    this.setStatus("idle");
  }

  seekTo(sentenceIndex: number) {
    const wasPlaying = this.status === "playing" || this.status === "paused";
    this.stopped = true;
    if (this.isSupported) window.speechSynthesis.cancel();
    this.currentIndex = Math.max(0, Math.min(sentenceIndex, this.sentences.length - 1));
    if (wasPlaying) {
      this.stopped = false;
      this.speakCurrent();
    }
  }

  getStatus(): ReaderStatus {
    return this.status;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}
