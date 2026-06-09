type SmokeResult = {
  ok: boolean;
  errors: string[];
};

class Reader {
  constructor(private readonly view: DataView, public offset = 0) {}

  private ensure(bytes: number): void {
    if (this.offset + bytes > this.view.byteLength) throw new Error('Unexpected end of stream');
  }

  u8(): number { this.ensure(1); const v = this.view.getUint8(this.offset); this.offset += 1; return v; }
  u16(): number { this.ensure(2); const v = this.view.getUint16(this.offset, true); this.offset += 2; return v; }
  u32(): number { this.ensure(4); const v = this.view.getUint32(this.offset, true); this.offset += 4; return v; }
  i16(): number { this.ensure(2); const v = this.view.getInt16(this.offset, true); this.offset += 2; return v; }
  i32(): number { this.ensure(4); const v = this.view.getInt32(this.offset, true); this.offset += 4; return v; }
  f32(): number { this.ensure(4); const v = this.view.getFloat32(this.offset, true); this.offset += 4; return v; }
  skip(bytes: number): void { this.ensure(bytes); this.offset += bytes; }
}

function parseObject(r: Reader): number {
  r.u16();
  const type = r.u8();
  switch (type) {
    case 0: { r.u8(); r.u8(); r.u16(); const n = r.u8(); const m = r.u8(); const l = r.u8(); r.skip(n * 6 + m * 2 + l * 2); return type; }
    case 1: { r.u8(); r.u16(); const n = r.u8(); const m = r.u8(); r.skip(n * 6 + m * 2); return type; }
    case 3: { r.u16(); r.u16(); r.u8(); const n = r.u8(); r.u8(); r.skip(n * 6); return type; }
    case 4: { r.u8(); const n = r.u8(); r.u8(); r.skip(n * 2); return type; }
    case 5: { r.u8(); r.u8(); const n = r.u8(); r.u8(); r.skip(n * 6); return type; }
    case 6: { r.u16(); r.u16(); r.u8(); r.u8(); r.u8(); r.u8(); const n = r.u8(); const m = r.u8(); r.skip(n * 6 + m * 2); return type; }
    case 7: { r.u8(); r.u16(); r.u16(); r.u16(); r.u8(); r.u8(); const n = r.u8(); r.skip(n * 2); return type; }
    case 8: { r.u16(); r.u16(); r.u8(); r.u16(); r.u16(); r.u8(); r.u16(); r.u8(); const len = r.u8(); r.skip(len); r.u8(); const n = r.u8(); r.skip(n * 2); return type; }
    case 9: { r.u16(); r.u16(); r.u8(); r.u16(); r.u8(); r.u16(); r.u32(); r.u32(); r.u32(); r.i32(); r.f32(); r.u8(); r.u8(); r.u8(); r.u8(); const n = r.u8(); r.skip(n * 2); return type; }
    case 10: { r.u16(); r.u16(); r.u16(); r.u8(); const n = r.u8(); r.u8(); const m = r.u8(); r.skip(n * 2 + m * 2); return type; }
    case 11: { r.u16(); r.u16(); r.u8(); r.u16(); r.u8(); r.u16(); r.u8(); const len = r.u16(); r.skip(len); r.u8(); return type; }
    case 12: { r.u16(); r.u16(); r.u8(); r.u16(); r.u8(); r.u16(); r.u32(); r.i32(); r.f32(); r.u8(); r.u8(); r.u8(); r.u8(); return type; }
    case 14: { r.u16(); r.u16(); r.u16(); r.u8(); r.u16(); r.u8(); return type; }
    case 20: { r.u16(); r.u16(); r.u16(); r.u8(); r.u8(); r.u8(); const len = r.u32(); const m = r.u8(); r.skip(len + m * 2); return type; }
    case 21: { r.u32(); return type; }
    case 22: { const len = r.u16(); r.skip(len); return type; }
    case 23: { r.u8(); r.u8(); r.u8(); r.u8(); r.u8(); return type; }
    case 24: { r.u8(); r.u8(); r.u16(); r.u8(); return type; }
    case 25: { r.u8(); r.u8(); r.u16(); r.u8(); return type; }
    default: throw new Error(`Unknown object type ${type}`);
  }
}

export function smokeValidateObjectPool(bytes: Uint8Array): SmokeResult {
  const errors: string[] = [];
  try {
    const r = new Reader(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    let sawWs = false;
    let sawDm = false;
    while (r.offset < bytes.byteLength) {
      const type = parseObject(r);
      if (type === 0) sawWs = true;
      if (type === 1) sawDm = true;
    }
    if (!sawWs) errors.push('Export smoke validation failed: no Working Set record found');
    if (!sawDm) errors.push('Export smoke validation failed: no Data Mask record found');
  } catch (err) {
    errors.push(`Export smoke validation failed: ${(err as Error).message}`);
  }
  return { ok: errors.length === 0, errors };
}
