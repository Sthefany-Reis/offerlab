import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export interface PickedDocument {
  text: string;
  name: string;
  warning?: string;
}

/**
 * Best-effort client-side text extraction.
 * - .txt / .md / .rtf: read directly.
 * - .pdf / .docx: extract readable ASCII runs from the raw bytes. This is a
 *   heuristic (no native parser is bundled); complex or image-based files may
 *   yield partial text, so we surface a warning and let the user paste instead.
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
  // collapse whitespace and strip obvious binary noise tokens
  return out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s{3,}/g, '\n\n')
    .trim();
}

async function fileToBytes(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

function decodeText(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

export async function pickAndExtractCv(): Promise<PickedDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf',
      'text/rtf',
      'text/markdown',
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const name = asset.name ?? 'document';
  const lower = name.toLowerCase();

  // Web returns a File via uri; native returns a file:// uri. Both support fetch.
  const bytes = await fileToBytes(asset.uri);

  if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.rtf')) {
    const text = decodeText(bytes).trim();
    return { text, name };
  }

  const text = extractReadableText(bytes);
  const looksThin = text.replace(/\s+/g, '').length < 120;
  return {
    text,
    name,
    warning: looksThin
      ? 'We could not reliably read this file. For best results, paste your CV text.'
      : Platform.OS === 'web'
        ? undefined
        : 'Extracted text from the file. Review it and edit if anything looks off.',
  };
}
