/** Binary writer that accumulates bytes in little-endian format. */
export class ByteWriter {
  private chunks: number[] = [];

  u8(v: number): void {
    this.chunks.push(v & 0xff);
  }

  u16(v: number): void {
    this.chunks.push(v & 0xff, (v >> 8) & 0xff);
  }

  /** Signed 16-bit — stored as two's-complement u16. */
  i16(v: number): void {
    this.u16(v & 0xffff);
  }

  u32(v: number): void {
    this.chunks.push(
      v & 0xff,
      (v >> 8) & 0xff,
      (v >> 16) & 0xff,
      (v >>> 24) & 0xff,
    );
  }

  /** Signed 32-bit — reinterpret as unsigned before writing. */
  i32(v: number): void {
    this.u32(v >>> 0);
  }

  /** IEEE 754 single-precision float, little-endian. */
  f32(v: number): void {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setFloat32(0, v, true);
    for (const byte of new Uint8Array(buffer)) {
      this.chunks.push(byte);
    }
  }

  raw(data: Uint8Array | number[]): void {
    for (const byte of data) {
      this.chunks.push(byte & 0xff);
    }
  }

  result(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(this.chunks);
  }

  get length(): number {
    return this.chunks.length;
  }
}
