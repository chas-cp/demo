export interface VoiceLibraryEntry {
  id: string;
  displayName: string;
  provider: "System" | "Cloud (needs API key)";
  accent: string;
  description: string;
  /** Substrings matched (case-insensitively) against the browser's installed
   * SpeechSynthesisVoice names to find a real voice that corresponds to this entry. */
  matchHints: string[];
}

/**
 * A curated list of widely-known AI narration voices. Preview each one on
 * YouTube (search links are generated below) before picking it — this app
 * does not clone or extract audio from any video, it only maps a name you
 * recognize to a real installed system voice (or a cloud provider you
 * configure) that sounds similar.
 */
export const VOICE_LIBRARY: VoiceLibraryEntry[] = [
  {
    id: "ms-aria",
    displayName: "Microsoft Aria",
    provider: "System",
    accent: "US English",
    description: "Warm, conversational neural voice built into Edge/Windows.",
    matchHints: ["aria"],
  },
  {
    id: "ms-guy",
    displayName: "Microsoft Guy",
    provider: "System",
    accent: "US English",
    description: "Confident male neural voice built into Edge/Windows.",
    matchHints: ["guy"],
  },
  {
    id: "ms-jenny",
    displayName: "Microsoft Jenny",
    provider: "System",
    accent: "US English",
    description: "Friendly, upbeat neural voice, popular for narration.",
    matchHints: ["jenny"],
  },
  {
    id: "google-us-female",
    displayName: "Google US English",
    provider: "System",
    accent: "US English",
    description: "Google's default Chrome text-to-speech voice.",
    matchHints: ["google us english"],
  },
  {
    id: "google-uk-female",
    displayName: "Google UK English Female",
    provider: "System",
    accent: "British English",
    description: "Clear, neutral British voice built into Chrome.",
    matchHints: ["google uk english female"],
  },
  {
    id: "apple-samantha",
    displayName: "Samantha",
    provider: "System",
    accent: "US English",
    description: "The classic Apple/macOS & iOS default voice.",
    matchHints: ["samantha"],
  },
  {
    id: "apple-daniel",
    displayName: "Daniel",
    provider: "System",
    accent: "British English",
    description: "Apple's British English voice, common on iPhone.",
    matchHints: ["daniel"],
  },
  {
    id: "polly-joanna",
    displayName: "Amazon Polly — Joanna",
    provider: "Cloud (needs API key)",
    accent: "US English",
    description: "Amazon's popular neural narration voice.",
    matchHints: ["joanna"],
  },
  {
    id: "polly-matthew",
    displayName: "Amazon Polly — Matthew",
    provider: "Cloud (needs API key)",
    accent: "US English",
    description: "Amazon's deep, newsreader-style male voice.",
    matchHints: ["matthew"],
  },
  {
    id: "elevenlabs-rachel",
    displayName: "ElevenLabs — Rachel",
    provider: "Cloud (needs API key)",
    accent: "US English",
    description: "High-realism AI voice, widely used in narration content.",
    matchHints: ["rachel"],
  },
];

export function youtubePreviewUrl(entry: VoiceLibraryEntry): string {
  const query = `${entry.displayName} AI voice sample demo`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/** Finds an installed browser voice matching a voice-library entry, if any. */
export function findSystemVoice(
  entry: VoiceLibraryEntry,
  systemVoices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const hints = entry.matchHints;
  return (
    systemVoices.find((v) => {
      const name = v.name.toLowerCase();
      return hints.some((hint) => name.includes(hint));
    }) ?? null
  );
}
