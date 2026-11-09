import { ByteWriter } from '../byteWriter';

export type ZipEntry = { path: string; data: Uint8Array };

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Build an uncompressed (store-only) .zip archive.
 * shortcut: no deflate, no zip64 (4 GB limit); fine for object pools, swap in a zip library if archives grow.
 */
export function zipStore(entries: ZipEntry[]): Uint8Array<ArrayBuffer> {
  const w = new ByteWriter();
  const central = new ByteWriter();
  const encoder = new TextEncoder();

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const crc = crc32(entry.data);
    const offset = w.length;
    // Local file header
    w.u32(0x04034b50);
    w.u16(20); w.u16(0x0800); w.u16(0); // version, UTF-8 names, stored
    w.u16(0); w.u16(0x21); // time 00:00, date 1980-01-01
    w.u32(crc); w.u32(entry.data.length); w.u32(entry.data.length);
    w.u16(name.length); w.u16(0);
    w.raw(name);
    w.raw(entry.data);
    // Central directory header
    central.u32(0x02014b50);
    central.u16(20); central.u16(20); central.u16(0x0800); central.u16(0);
    central.u16(0); central.u16(0x21);
    central.u32(crc); central.u32(entry.data.length); central.u32(entry.data.length);
    central.u16(name.length); central.u16(0); central.u16(0); central.u16(0); central.u16(0);
    central.u32(0); central.u32(offset);
    central.raw(name);
  }

  const centralBytes = central.result();
  const centralOffset = w.length;
  w.raw(centralBytes);
  // End of central directory
  w.u32(0x06054b50);
  w.u16(0); w.u16(0);
  w.u16(entries.length); w.u16(entries.length);
  w.u32(centralBytes.length); w.u32(centralOffset);
  w.u16(0);
  return w.result();
}
