import { describe, expect, it } from 'vitest';
import { isValidIPv4, validateFirewall } from './validation';
import { seedFirewalls } from '../data/seedFirewalls';

const valid = {
  name: 'NEW-FW-01',
  manufacturer: 'Cisco',
  model: 'Firepower 1010',
  serialNumber: 'ABC-123',
  ipAddress: '10.20.30.40',
  location: 'Test Lab',
  status: 'Active',
  firmwareVersion: '7.0',
  purchaseDate: '2024-01-01',
  notes: '',
};

describe('isValidIPv4', () => {
  it.each(['0.0.0.0', '10.0.0.1', '192.168.1.254', '255.255.255.255'])('accepts %s', (ip) => {
    expect(isValidIPv4(ip)).toBe(true);
  });

  it.each(['256.1.1.1', '10.0.0', '10.0.0.1.5', '01.2.3.4', 'abc.def.ghi.jkl', '', ' 10.0.0.1'])(
    'rejects "%s"',
    (ip) => {
      expect(isValidIPv4(ip)).toBe(false);
    },
  );
});

describe('validateFirewall', () => {
  it('returns no errors for valid input', () => {
    expect(validateFirewall(valid, seedFirewalls)).toEqual({});
  });

  it('requires the mandatory fields', () => {
    const errors = validateFirewall({ ...valid, name: '', manufacturer: '', model: '', ipAddress: '', location: '', status: '' });
    expect(Object.keys(errors).sort()).toEqual(['ipAddress', 'location', 'manufacturer', 'model', 'name', 'status']);
    expect(errors.name).toBe('Name is required');
  });

  it('treats whitespace-only values as empty', () => {
    expect(validateFirewall({ ...valid, name: '   ' }).name).toBe('Name is required');
  });

  it('enforces name length and characters', () => {
    expect(validateFirewall({ ...valid, name: 'A' }).name).toMatch(/2–50/);
    expect(validateFirewall({ ...valid, name: 'x'.repeat(51) }).name).toMatch(/2–50/);
    expect(validateFirewall({ ...valid, name: '<script>' }).name).toMatch(/may contain only/);
  });

  it('rejects duplicate names case-insensitively', () => {
    expect(validateFirewall({ ...valid, name: 'hq-edge-fw-01' }, seedFirewalls).name).toBe(
      'A firewall with this name already exists',
    );
  });

  it('rejects duplicate IP addresses', () => {
    expect(validateFirewall({ ...valid, ipAddress: '10.0.0.1' }, seedFirewalls).ipAddress).toBe(
      'This IP address is already assigned',
    );
  });

  it('ignores the record being edited in uniqueness checks', () => {
    const own = seedFirewalls[0];
    const errors = validateFirewall({ ...valid, name: own.name, ipAddress: own.ipAddress }, seedFirewalls, own.id);
    expect(errors).toEqual({});
  });

  it('rejects an invalid IP format', () => {
    expect(validateFirewall({ ...valid, ipAddress: '256.1.1.1' }).ipAddress).toMatch(/valid IPv4/);
  });

  it('rejects unknown manufacturer and status values', () => {
    const errors = validateFirewall({ ...valid, manufacturer: 'Acme', status: 'Broken' });
    expect(errors.manufacturer).toBeDefined();
    expect(errors.status).toBeDefined();
  });

  it('validates optional fields only when provided', () => {
    expect(validateFirewall({ ...valid, serialNumber: '', firmwareVersion: '', purchaseDate: '', notes: '' })).toEqual({});
    expect(validateFirewall({ ...valid, serialNumber: 'AB 12' }).serialNumber).toBeDefined();
    expect(validateFirewall({ ...valid, firmwareVersion: 'x'.repeat(21) }).firmwareVersion).toBeDefined();
    expect(validateFirewall({ ...valid, notes: 'x'.repeat(501) }).notes).toBeDefined();
  });

  it('reports non-text values as errors instead of throwing (SEC-03)', () => {
    const errors = validateFirewall({ ...valid, name: 12345, location: null }, seedFirewalls);
    expect(errors.name).toBe('Invalid value: text expected');
    expect(errors.location).toBe('Location is required');
  });

  it('rejects future and impossible purchase dates', () => {
    expect(validateFirewall({ ...valid, purchaseDate: '2999-01-01' }).purchaseDate).toMatch(/future/);
    expect(validateFirewall({ ...valid, purchaseDate: '2024-02-30' }).purchaseDate).toMatch(/valid date/);
  });
});
