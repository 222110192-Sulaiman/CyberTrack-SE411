import { describe, expect, it } from 'vitest';
import { initials, percentOf } from './format';
import { filterFirewalls, matchesQuery } from './search';
import { seedFirewalls } from '../data/seedFirewalls';

describe('percentOf', () => {
  it('rounds to a whole percentage', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(6, 10)).toBe(60);
  });

  it('returns 0 when the total is 0', () => {
    expect(percentOf(0, 0)).toBe(0);
  });
});

describe('initials', () => {
  it('uses the first letters of the first and last names', () => {
    expect(initials('Sulaiman AlHoshan', 'M1')).toBe('SA');
    expect(initials('Ali Bin Saleh', 'M1')).toBe('AS');
    expect(initials('Fahad', 'M1')).toBe('F');
  });

  it('falls back for placeholders and empty names', () => {
    expect(initials('[Team Member 1 Name]', 'M1')).toBe('M1');
    expect(initials('', 'M2')).toBe('M2');
  });
});

describe('search helpers', () => {
  it('matches every record for an empty or blank query', () => {
    expect(filterFirewalls(seedFirewalls, '   ')).toHaveLength(seedFirewalls.length);
  });

  it('does not search fields outside the defined set', () => {
    // "Primary perimeter firewall" is a note on FW-0001; notes are not searchable.
    expect(matchesQuery(seedFirewalls[0], 'perimeter')).toBe(false);
  });
});
