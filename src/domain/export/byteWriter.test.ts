import { describe, expect, it } from 'vitest';
import { ByteWriter } from './byteWriter';

describe('ByteWriter', () => {
  it('writes primitive values in little-endian order', () => {
    const writer = new ByteWriter();
    writer.u8(0x12);
    writer.u16(0x3456);
    writer.i16(-2);
    writer.u32(0x12345678);
    writer.i32(-1);
    writer.f32(1.5);
    writer.raw([0x1ff, -1]);

    expect(Array.from(writer.result())).toEqual([
      0x12,
      0x56, 0x34,
      0xfe, 0xff,
      0x78, 0x56, 0x34, 0x12,
      0xff, 0xff, 0xff, 0xff,
      0x00, 0x00, 0xc0, 0x3f,
      0xff, 0xff,
    ]);
    expect(writer.length).toBe(19);
  });
});
