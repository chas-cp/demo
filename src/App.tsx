import { useCallback, useEffect, useRef, useState } from "react";
import FileUpload from "./components/FileUpload";
import GoogleDriveImport from "./components/GoogleDriveImport";
import VoiceSelector from "./components/VoiceSelector";
import ReaderView from "./components/ReaderView";
import { extractDocument } from "./lib/textExtract";
import { getVoices, SpeechReader, type ReaderStatus, type Sentence } from "./lib/tts";

export default function App() {
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);

  const [docTitle, setDocTitle] = useState<string | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<ReaderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const readerRef = useRef<SpeechReader | null>(null);

  useEffect(() => {
    getVoices().then((voices) => {
      setSystemVoices(voices);
      if (voices.length && !selectedVoice) {
        const defaultVoice = voices.find((v) => v.default) ?? voices[0];
        setSelectedVoice(defaultVoice);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    readerRef.current = new SpeechReader({
      onStatusChange: setStatus,
      onSentenceStart: setCurrentIndex,
      onError: setError,
    });
    return () => readerRef.current?.stop();
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoadingFile(true);
    readerRef.current?.stop();
    try {
      const doc = await extractDocument(file);
      const loadedSentences = readerRef.current!.loadText(doc.text);
      setDocTitle(doc.title);
      setSentences(loadedSentences);
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read that file.");
    } finally {
      setLoadingFile(false);
    }
  }, []);

  const play = () =>
    readerRef.current?.play({ voice: selectedVoice, rate, pitch: 1, startAt: currentIndex });
  const pause = () => readerRef.current?.pause();
  const resume = () => readerRef.current?.resume();
  const stop = () => readerRef.current?.stop();
  const seek = (index: number) => {
    setCurrentIndex(index);
    if (status === "playing" || status === "paused") {
      readerRef.current?.seekTo(index);
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>VoxRead</h1>
        <p className="app__tagline">Have any document read aloud in an AI voice you choose.</p>
      </header>

      {error && <div className="banner banner--error">{error}</div>}

      {!sentences.length ? (
        <div className="panel">
          <FileUpload onFile={handleFile} disabled={loadingFile} />
          <div className="or-divider">or</div>
          <GoogleDriveImport onFile={handleFile} disabled={loadingFile} />
          {loadingFile && <p className="hint">Reading document…</p>}
        </div>
      ) : (
        <div className="layout">
          <ReaderView
            title={docTitle ?? "Document"}
            sentences={sentences}
            currentIndex={currentIndex}
            status={status}
            rate={rate}
            onPlay={play}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            onSeek={seek}
            onRateChange={setRate}
          />
          <aside className="sidebar">
            <button
              className="btn btn--link"
              onClick={() => {
                stop();
                setSentences([]);
                setDocTitle(null);
              }}
            >
              ← Load a different document
            </button>
            <VoiceSelector
              systemVoices={systemVoices}
              selectedVoiceURI={selectedVoice?.voiceURI ?? null}
              onSelectVoice={(voice) => {
                setSelectedVoice(voice);
                if (status === "playing") {
                  readerRef.current?.play({ voice, rate, pitch: 1, startAt: currentIndex });
                }
              }}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
