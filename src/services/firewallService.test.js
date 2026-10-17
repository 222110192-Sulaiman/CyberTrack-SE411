import { beforeEach, describe, expect, it } from 'vitest';
import { createFirewallService, NotFoundError, ValidationError } from './firewallService';
import { seedFirewalls } from '../data/seedFirewalls';

const input = {
  name: 'NEW-FW-01',
  manufacturer: 'Sophos',
  model: 'XGS 116',
  ipAddress: '10.99.0.1',
  location: 'Test Lab',
  status: 'Active',
};

describe('firewallService', () => {
  let service;

  beforeEach(() => {
    service = createFirewallService(seedFirewalls);
  });

  it('returns the seeded collection', async () => {
    expect(await service.getAll()).toHaveLength(seedFirewalls.length);
  });

  it('returns copies so callers cannot mutate the store', async () => {
    const [first] = await service.getAll();
    first.name = 'MUTATED';
    expect((await service.getById(first.id)).name).not.toBe('MUTATED');
  });

  it('does not mutate the seed data', async () => {
    await service.remove('FW-0001');
    expect(seedFirewalls[0].id).toBe('FW-0001');
    expect(await createFirewallService(seedFirewalls).getById('FW-0001')).not.toBeNull();
  });

  it('creates a firewall with a generated ID and timestamps', async () => {
    const created = await service.create({ ...input, name: '  NEW-FW-01  ' });
    expect(created.id).toBe('FW-0011');
    expect(created.name).toBe('NEW-FW-01');
    expect(created.createdAt).toBe(created.updatedAt);
    expect(await service.getAll()).toHaveLength(seedFirewalls.length + 1);
  });

  it('ignores unknown and system fields on create', async () => {
    const created = await service.create({ ...input, id: 'HACK', createdAt: 'x', isAdmin: true });
    expect(created.id).toBe('FW-0011');
    expect(created).not.toHaveProperty('isAdmin');
  });

  it('rejects invalid input with field errors', async () => {
    await expect(service.create({ ...input, ipAddress: '10.0.0.1' })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.create({ ...input, ipAddress: 'bad' })).rejects.toMatchObject({
      errors: { ipAddress: expect.any(String) },
    });
  });

  it('updates a firewall and refreshes updatedAt', async () => {
    const before = await service.getById('FW-0001');
    const updated = await service.update('FW-0001', { ...before, status: 'Maintenance' });
    expect(updated.status).toBe('Maintenance');
    expect(updated.id).toBe('FW-0001');
    expect(updated.createdAt).toBe(before.createdAt);
    expect(new Date(updated.updatedAt) > new Date(before.updatedAt)).toBe(true);
  });

  it('never reuses the ID of a deleted firewall', async () => {
    await service.remove('FW-0010');
    const created = await service.create(input);
    expect(created.id).toBe('FW-0011');
  });

  it('keeps the ID and createdAt when update input tries to change them', async () => {
    const before = await service.getById('FW-0002');
    const updated = await service.update('FW-0002', { ...before, id: 'FW-9999', createdAt: '2000-01-01T00:00:00.000Z' });
    expect(updated.id).toBe('FW-0002');
    expect(updated.createdAt).toBe(before.createdAt);
    expect(await service.getById('FW-9999')).toBeNull();
  });

  it('rejects an update that duplicates another firewall and leaves the record unchanged', async () => {
    const before = await service.getById('FW-0002');
    await expect(service.update('FW-0002', { ...before, ipAddress: '10.0.0.1' })).rejects.toMatchObject({
      errors: { ipAddress: 'This IP address is already assigned' },
    });
    expect(await service.getById('FW-0002')).toEqual(before);
  });

  it('rejects updates to unknown IDs', async () => {
    await expect(service.update('FW-9999', input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('removes a firewall', async () => {
    expect(await service.remove('FW-0003')).toBe(true);
    expect(await service.getById('FW-0003')).toBeNull();
    expect(await service.remove('FW-0003')).toBe(false);
  });

  describe('rejects values that are not text (SEC-03)', () => {
    it('does not store a numeric name in an empty store', async () => {
      const empty = createFirewallService([]);
      await expect(empty.create({ ...input, name: 12345 })).rejects.toMatchObject({
        name: 'ValidationError',
        errors: { name: 'Invalid value: text expected' },
      });
      expect(await empty.getAll()).toHaveLength(0);
    });

    it('returns a ValidationError, not a TypeError, when other firewalls exist', async () => {
      await expect(service.create({ ...input, name: 12345 })).rejects.toBeInstanceOf(ValidationError);
    });

    it.each([
      ['model', { text: 'X' }],
      ['ipAddress', ['10.0.0.9']],
      ['status', true],
      ['notes', 42],
    ])('rejects a non-text %s', async (field, value) => {
      await expect(service.create({ ...input, [field]: value })).rejects.toMatchObject({
        errors: { [field]: 'Invalid value: text expected' },
      });
      expect(await service.getAll()).toHaveLength(seedFirewalls.length);
    });

    it('rejects non-text values on update and leaves the record unchanged', async () => {
      const before = await service.getById('FW-0002');
      await expect(service.update('FW-0002', { ...before, location: 99 })).rejects.toBeInstanceOf(ValidationError);
      expect(await service.getById('FW-0002')).toEqual(before);
    });

    it('treats a missing input object as empty input', async () => {
      await expect(service.create(null)).rejects.toMatchObject({ errors: { name: 'Name is required' } });
    });
  });

  it('searches case-insensitively across ID, name, manufacturer, IP and location', async () => {
    expect((await service.search('forti')).map((f) => f.id)).toEqual(['FW-0001', 'FW-0002']);
    expect((await service.search('FW-0004')).map((f) => f.id)).toEqual(['FW-0004']);
    expect((await service.search('172.16.20')).map((f) => f.id)).toEqual(['FW-0005']);
    expect((await service.search('jeddah')).length).toBe(2);
    expect(await service.search('')).toHaveLength(seedFirewalls.length);
    expect(await service.search('zzzz')).toHaveLength(0);
  });
});
