import { describe, expect, it } from 'vitest';
import { formatAssetId, isAssetId, parseAssetId } from './assetId';

describe('Asset IDs', () => {
  it('formats a database id as FW-0000', () => {
    expect(formatAssetId(7)).toBe('FW-0007');
    expect(formatAssetId(12345)).toBe('FW-12345');
  });

  it('parses Asset IDs in any letter case, ignoring spaces', () => {
    expect(parseAssetId('FW-0007')).toBe(7);
    expect(parseAssetId('  fw-12 ')).toBe(12);
  });

  it.each(['', 'FW-', 'FW-0000', 'FW-12a', '7', 'cisco', null, undefined])('rejects %s', (value) => {
    expect(parseAssetId(value)).toBeNull();
    expect(isAssetId(value)).toBe(false);
  });
});
