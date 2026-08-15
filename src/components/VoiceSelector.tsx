import { VOICE_LIBRARY, findSystemVoice, youtubePreviewUrl } from "../lib/voiceLibrary";

interface Props {
  systemVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
}

export default function VoiceSelector({ systemVoices, selectedVoiceURI, onSelectVoice }: Props) {
  return (
    <div className="voice-selector">
      <h2>AI voice</h2>
      <p className="hint hint--muted">
        Preview a voice on YouTube, then pick whichever installed voice on your
        device matches it best.
      </p>

      <ul className="voice-list">
        {VOICE_LIBRARY.map((entry) => {
          const match = findSystemVoice(entry, systemVoices);
          const isSelected = match && match.voiceURI === selectedVoiceURI;
          return (
            <li
              key={entry.id}
              className={`voice-card ${isSelected ? "voice-card--selected" : ""} ${
                !match ? "voice-card--unavailable" : ""
              }`}
            >
              <div className="voice-card__main">
                <div className="voice-card__name">{entry.displayName}</div>
                <div className="voice-card__meta">
                  {entry.accent} · {entry.provider}
                </div>
                <div className="voice-card__desc">{entry.description}</div>
              </div>
              <div className="voice-card__actions">
                <a
                  className="btn btn--link"
                  href={youtubePreviewUrl(entry)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Preview on YouTube
                </a>
                <button
                  className="btn btn--small"
                  disabled={!match}
                  onClick={() => match && onSelectVoice(match)}
                >
                  {isSelected ? "Selected" : match ? "Use this voice" : "Not installed"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <details className="voice-advanced">
        <summary>All voices installed on this device ({systemVoices.length})</summary>
        <ul className="voice-list voice-list--compact">
          {systemVoices.map((v) => (
            <li key={v.voiceURI}>
              <button
                className={`btn btn--small ${v.voiceURI === selectedVoiceURI ? "btn--active" : ""}`}
                onClick={() => onSelectVoice(v)}
              >
                {v.name} ({v.lang})
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
