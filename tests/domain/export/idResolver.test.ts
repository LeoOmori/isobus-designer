import { describe, expect, it } from 'vitest';
import { NULL_OBJECT_ID, buildIdMap, parseHexObjectId, resolveRef } from '../../../src/domain/export/idResolver';

describe('idResolver', () => {
  it('parses and resolves ids', () => {
    expect(parseHexObjectId('0x0203')).toBe(0x0203);
    expect(() => parseHexObjectId('0xffff')).toThrow(/Invalid object ID/);
    expect(NULL_OBJECT_ID).toBe(0xffff);

    const map = buildIdMap({
      workingSet: { id: 'WS_1' },
      objects: [{ id: 'DM_1', objectId: '0x0201' }],
    } as never);

    expect(map.get('WS_1')).toBe(0x0000);
    expect(map.get('DM_1')).toBe(0x0201);
    expect(resolveRef('DM_1', map)).toBe(0x0201);
    expect(resolveRef('missing', map)).toBe(0xffff);
    expect(resolveRef(undefined, map)).toBe(0xffff);
  });
});
