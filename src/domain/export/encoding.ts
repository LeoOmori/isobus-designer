import { vtFontCells } from '../isobus';

/** Returns true if every code point in the string is in the Latin-1 (ISO 8859-1) range. */
export function isLatin1(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0xff) return false;
  }
  return true;
}

/**
 * Encode a string as Latin-1 into a fixed-size buffer.
 * Bytes past the end of the string are filled with `pad` (default 0x00).
 * Characters above 0xFF are truncated to their low byte (validator should catch before this).
 */
export function encodeLatin1Padded(text: string, length: number, pad = 0x00): Uint8Array {
  const buf = new Uint8Array(length).fill(pad);
  const limit = Math.min(text.length, length);
  for (let i = 0; i < limit; i++) {
    buf[i] = text.charCodeAt(i) & 0xff;
  }
  return buf;
}

/**
 * Encode a variable-length string as Latin-1 bytes (no padding, no length prefix).
 * Characters above 0xFF are truncated to their low byte.
 */
export function encodeLatin1(text: string): Uint8Array {
  const buf = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    buf[i] = text.charCodeAt(i) & 0xff;
  }
  return buf;
}

/**
 * Map editor fontWidth × fontHeight to an ISO 11783-6 Font Size enum index (0–9 for V1).
 * Returns -1 if no standard cell matches.
 */
export function fontSizeEnum(width: number, height: number): number {
  return vtFontCells.findIndex((cell) => cell.width === width && cell.height === height);
}

/**
 * Parse a lineArt hex string (e.g. "0xFFFF", "0xF0F0") to uint16.
 * Returns 0xFFFF (solid) if the string is missing or unparseable.
 */
export function parseLineArt(lineArt: string | undefined): number {
  if (!lineArt) return 0xffff;
  const n = parseInt(lineArt.replace(/^0x/i, ''), 16);
  return Number.isFinite(n) ? n & 0xffff : 0xffff;
}
