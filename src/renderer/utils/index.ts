export function formatServicePrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Үнэгүй';
  }

  const numericValue =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/[^\d.-]/g, '').trim());

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 'Үнэгүй';
  }

  return `${numericValue.toLocaleString('mn-MN')}₮`;
}

const HTML_PREFIX_BASE64 = 'PCFET0NUWVBFIGh0bWw';
const HTML_TAG_PREFIX_BASE64 = 'PGh0bWw';
const PDF_PREFIX_BASE64 = 'JVBER';
const JPEG_PREFIX_BASE64 = '/9j/';
const PNG_PREFIX_BASE64 = 'iVBORw0KGgo';
const GIF_PREFIX_BASE64 = 'R0lGOD';

export type Base64ContentKind = 'image' | 'pdf' | 'html' | 'text' | 'unknown';

export function normalizeBase64Payload(input: string): string {
  const trimmed = String(input || '').trim().replace(/^["'`]+|["'`]+$/g, '');
  if (!trimmed) return '';

  const dataUriMatch = trimmed.match(/^data:.*?;base64,(.+)$/i);
  const payload = dataUriMatch ? dataUriMatch[1] : trimmed;
  return payload.replace(/\s+/g, '');
}

export function detectBase64ContentKind(base64: string): Base64ContentKind {
  const normalized = normalizeBase64Payload(base64);
  if (!normalized) return 'unknown';
  if (
    normalized.startsWith(JPEG_PREFIX_BASE64) ||
    normalized.startsWith(PNG_PREFIX_BASE64) ||
    normalized.startsWith(GIF_PREFIX_BASE64)
  ) {
    return 'image';
  }
  if (normalized.startsWith(PDF_PREFIX_BASE64)) {
    return 'pdf';
  }
  if (
    normalized.startsWith(HTML_PREFIX_BASE64) ||
    normalized.startsWith(HTML_TAG_PREFIX_BASE64)
  ) {
    return 'html';
  }

  try {
    const decoded = decodeBase64Utf8(normalized).trimStart();
    if (/^<!doctype\s+html\b/i.test(decoded) || /^<html\b/i.test(decoded)) {
      return 'html';
    }

    const compact = decoded.trim();
    if (compact) {
      const hasBinaryControls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(compact);
      if (!hasBinaryControls) {
        return 'text';
      }
    }
  } catch {
    // Ignore decode failures and fall back to unknown.
  }

  return 'unknown';
}

export function decodeBase64Utf8(base64: string): string {
  const normalized = normalizeBase64Payload(base64);
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export function buildDataUriFromBase64(base64: string): string {
  const normalized = normalizeBase64Payload(base64);
  const kind = detectBase64ContentKind(normalized);
  if (!normalized) return '';
  if (kind === 'pdf') {
    return `data:application/pdf;base64,${normalized}`;
  }
  if (kind === 'html') {
    return `data:text/html;base64,${normalized}`;
  }
  if (kind === 'text') {
    return `data:text/plain;charset=utf-8;base64,${normalized}`;
  }
  if (normalized.startsWith(JPEG_PREFIX_BASE64)) {
    return `data:image/jpeg;base64,${normalized}`;
  }
  if (normalized.startsWith(PNG_PREFIX_BASE64)) {
    return `data:image/png;base64,${normalized}`;
  }
  if (normalized.startsWith(GIF_PREFIX_BASE64)) {
    return `data:image/gif;base64,${normalized}`;
  }
  return `data:application/octet-stream;base64,${normalized}`;
}

export function buildPrintableHtmlFromBase64(base64: string): string {
  const normalized = normalizeBase64Payload(base64);
  const kind = detectBase64ContentKind(normalized);
  const src = buildDataUriFromBase64(normalized);
  if (!src) return '';

  if (kind === 'html') {
    const htmlContent = decodeBase64Utf8(normalized);
    if (!htmlContent.trim()) return '';
    return htmlContent;
  }

  if (kind === 'text') {
    const textContent = decodeBase64Utf8(normalized);
    if (!textContent.trim()) return '';
    const escaped = textContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            html, body { margin: 0; padding: 24px; background: #fff; color: #111; font-family: "Segoe UI", Arial, sans-serif; }
            pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 16px; line-height: 1.5; }
          </style>
        </head>
        <body><pre>${escaped}</pre></body>
      </html>
    `;
  }

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
          body { display: flex; align-items: center; justify-content: center; background: #fff; font-family: "Segoe UI", Arial, sans-serif; }
          .doc-frame, .doc-image { width: 100%; height: 100%; border: 0; }
          .doc-image { object-fit: contain; }
        </style>
      </head>
      <body>
        ${
          src.startsWith('data:image/')
            ? `<img class="doc-image" src="${src}" />`
            : `<iframe class="doc-frame" src="${src}"></iframe>`
        }
      </body>
    </html>
  `;
}
