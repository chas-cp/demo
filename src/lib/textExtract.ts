import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore -- Vite resolves this worker asset URL at build time
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractedDocument {
  title: string;
  text: string;
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }
  return pages.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function extractPlainText(file: File): Promise<string> {
  return file.text();
}

export async function extractDocument(file: File): Promise<ExtractedDocument> {
  const name = file.name.toLowerCase();
  const title = file.name.replace(/\.[^/.]+$/, "");

  let text: string;
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    text = await extractPdf(file);
  } else if (
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await extractDocx(file);
  } else if (
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".rtf") ||
    file.type.startsWith("text/")
  ) {
    text = await extractPlainText(file);
  } else {
    // Best-effort fallback for unrecognized types (e.g. Notes exports with odd extensions)
    text = await extractPlainText(file);
  }

  const normalized = normalize(text);
  if (!normalized) {
    throw new Error(
      `Could not find readable text in "${file.name}". Try exporting it as .txt, .pdf, or .docx.`,
    );
  }
  return { title, text: normalized };
}

export const ACCEPTED_EXTENSIONS = [".txt", ".md", ".pdf", ".docx", ".rtf"];
