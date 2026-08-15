import { useRef, useState } from "react";
import { ACCEPTED_EXTENSIONS } from "../lib/textExtract";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFile(files[0]);
  };

  return (
    <div
      className={`dropzone ${dragOver ? "dropzone--active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        hidden
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="dropzone__title">Drop a document here, or click to browse</p>
      <p className="dropzone__hint">
        .txt · .md · .pdf · .docx — on iPhone, tap here and choose{" "}
        <strong>Browse</strong> to pick from Files, iCloud Drive, or a note you've
        saved/exported from the Notes app.
      </p>
    </div>
  );
}
