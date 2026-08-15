// Google Drive import via Google Identity Services (OAuth) + the Picker API.
// Requires a Google Cloud project with the Drive API and Picker API enabled,
// and VITE_GOOGLE_CLIENT_ID / VITE_GOOGLE_API_KEY set in .env (see README).

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_API_KEY);
}

async function ensureLoaded(): Promise<void> {
  await Promise.all([
    loadScript("https://accounts.google.com/gsi/client"),
    loadScript("https://apis.google.com/js/api.js"),
  ]);
  await new Promise<void>((resolve) => window.gapi.load("picker", () => resolve()));
}

function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp: any) => {
        if (resp.error) reject(new Error(resp.error));
        else resolve(resp.access_token);
      },
    });
    tokenClient.requestAccessToken();
  });
}

export interface DriveFilePick {
  id: string;
  name: string;
  mimeType: string;
}

function openPicker(accessToken: string, apiKey: string): Promise<DriveFilePick | null> {
  return new Promise((resolve) => {
    const view = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const picker = new window.google.picker.PickerBuilder()
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .addView(view)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          resolve({ id: doc.id, name: doc.name, mimeType: doc.mimeType });
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();
    picker.setVisible(true);
  });
}

const GOOGLE_NATIVE_EXPORT_MIME: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
};

async function downloadFile(pick: DriveFilePick, accessToken: string): Promise<File> {
  const exportMime = GOOGLE_NATIVE_EXPORT_MIME[pick.mimeType];
  const url = exportMime
    ? `https://www.googleapis.com/drive/v3/files/${pick.id}/export?mimeType=${encodeURIComponent(exportMime)}`
    : `https://www.googleapis.com/drive/v3/files/${pick.id}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google Drive download failed (${res.status})`);
  }
  const blob = await res.blob();
  const filename = exportMime ? `${pick.name}.txt` : pick.name;
  return new File([blob], filename, { type: exportMime ?? pick.mimeType });
}

/** Opens the Google account chooser + Drive file picker and returns the
 * selected file as a browser File, ready to feed into the text extractor. */
export async function importFromGoogleDrive(): Promise<File | null> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!clientId || !apiKey) {
    throw new Error(
      "Google Drive isn't configured. Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY (see README).",
    );
  }
  await ensureLoaded();
  const accessToken = await requestAccessToken(clientId);
  const pick = await openPicker(accessToken, apiKey);
  if (!pick) return null;
  return downloadFile(pick, accessToken);
}
