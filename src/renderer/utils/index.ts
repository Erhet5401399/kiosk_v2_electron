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

export type Base64ContentKind = 'image' | 'pdf' | 'html' | 'unknown';

export function detectBase64ContentKind(base64: string): Base64ContentKind {
  const normalized = String(base64 || '').trim();
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
  return 'unknown';
}

export function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export function buildDataUriFromBase64(base64: string): string {
  const normalized = String(base64 || '').trim();
  const kind = detectBase64ContentKind(normalized);
  if (!normalized) return '';
  if (kind === 'pdf') {
    return `data:application/pdf;base64,${normalized}`;
  }
  if (kind === 'html') {
    return `data:text/html;base64,${normalized}`;
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
  const src = buildDataUriFromBase64(base64);
  if (!src) return '';

  if (src.startsWith('data:text/html')) {
    return decodeBase64Utf8(base64);
  }

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
          body { display: flex; align-items: center; justify-content: center; background: #fff; }
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
