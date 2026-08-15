import { useState } from "react";
import { importFromGoogleDrive, isGoogleDriveConfigured } from "../lib/googleDrive";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function GoogleDriveImport({ onFile, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isGoogleDriveConfigured();

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const file = await importFromGoogleDrive();
      if (file) onFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google Drive import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drive-import">
      <button
        className="btn btn--secondary"
        onClick={handleClick}
        disabled={disabled || loading}
        title={configured ? "Import from Google Drive" : "Configure Google Drive credentials first (see README)"}
      >
        {loading ? "Opening Google Drive…" : "Import from Google Drive"}
      </button>
      {!configured && (
        <p className="hint hint--muted">
          Not configured yet — add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY to .env (see README).
        </p>
      )}
      {error && <p className="hint hint--error">{error}</p>}
    </div>
  );
}
