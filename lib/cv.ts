import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export interface PickedDocument {
  text: string;
  name: string;
  warning?: string;
}

/**
 * Best-effort client-side text extraction.
 * - .txt / .md / .rtf / .csv: read directly as UTF-8.
 * - .pdf: pull readable text runs and parenthesized PDF string literals.
 * - .docx / .doc: extract readable ASCII runs from the raw bytes (heuristic).
 *   Image-based or heavily compressed files may yield partial text, so we
 *   surface a warning and let the user paste instead.
 */
function extractReadableText(bytes: Uint8Array): string {
  let out = '';
  let run = '';
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    const isPrintable = c === 9 || c === 10 || c === 13 || (c >= 32 && c <= 126);
    if (isPrintable) {
      run += String.fromCharCode(c);
    } else {
      if (run.length >= 4) out += run + ' ';
      run = '';
    }
  }
  if (run.length >= 4) out += run;
  return out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s{3,}/g, '\n\n')
    .trim();
}

/** Pull text from parenthesized PDF string literals, e.g. "(Hello) Tj". */
function extractPdfText(bytes: Uint8Array): string {
  let raw = '';
  for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);

  const pieces: string[] = [];
  // (string) Tj  or  [(a) (b)] TJ
  const re = /\(((?:\\.|[^\\()])*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const s = m[1]
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ');
    if (s.trim().length > 0) pieces.push(s);
  }

  const joined = pieces
    .join(' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s{3,}/g, '\n\n')
    .trim();

  // Fall back to the generic ASCII scan when the PDF has no extractable
  // text operators (e.g. uncompressed or unusual encoders).
  if (joined.replace(/\s+/g, '').length < 60) return extractReadableText(bytes);
  return joined;
}

async function fileToBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }
  // Native: fetch on a file:// uri is unreliable. Use the File API instead.
  const file = new File(uri);
  return file.bytes();
}

function decodeText(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    try {
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      // fall through to manual decode
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

export async function pickAndExtractCv(): Promise<PickedDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const name = asset.name ?? 'document';
  const lower = name.toLowerCase();

  const bytes = await fileToBytes(asset.uri);

  if (
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.rtf') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.text')
  ) {
    const text = decodeText(bytes).trim();
    return { text, name };
  }

  const text = lower.endsWith('.pdf') ? extractPdfText(bytes) : extractReadableText(bytes);
  const looksThin = text.replace(/\s+/g, '').length < 120;
  return {
    text,
    name,
    warning: looksThin
      ? 'We could not reliably read this file. For best results, paste your CV text instead.'
      : 'Extracted text from the file. Review it and edit anything that looks off.',
  };
}
