import { useEffect, useRef } from "react";
import type { ReaderStatus, Sentence } from "../lib/tts";

interface Props {
  title: string;
  sentences: Sentence[];
  currentIndex: number;
  status: ReaderStatus;
  rate: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeek: (index: number) => void;
  onRateChange: (rate: number) => void;
}

export default function ReaderView({
  title,
  sentences,
  currentIndex,
  status,
  rate,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeek,
  onRateChange,
}: Props) {
  const activeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex]);

  const isPlaying = status === "playing";
  const isPaused = status === "paused";

  return (
    <div className="reader">
      <div className="reader__header">
        <h2 className="reader__title">{title}</h2>
        <div className="reader__controls">
          {!isPlaying && (
            <button className="btn btn--primary" onClick={isPaused ? onResume : onPlay}>
              {isPaused ? "Resume" : "▶ Play"}
            </button>
          )}
          {isPlaying && (
            <button className="btn btn--primary" onClick={onPause}>
              ⏸ Pause
            </button>
          )}
          <button className="btn" onClick={onStop} disabled={status === "idle"}>
            ⏹ Stop
          </button>
          <label className="rate-control">
            Speed {rate.toFixed(2)}x
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={rate}
              onChange={(e) => onRateChange(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="reader__text">
        {sentences.map((s, i) => (
          <span
            key={i}
            ref={i === currentIndex ? activeRef : undefined}
            className={`sentence ${i === currentIndex ? "sentence--active" : ""}`}
            onClick={() => onSeek(i)}
          >
            {s.text}{" "}
          </span>
        ))}
      </div>
    </div>
  );
}
