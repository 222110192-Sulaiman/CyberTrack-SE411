import { describe, expect, it, vi } from 'vitest';
import { createApiFirewallService, fromApi, toApiBody } from './apiFirewallService';

const BASE = '/api/v1/firewalls';

const apiFirewall = {
  id: 7,
  name: 'LAB-FW-01',
  manufacturer: 'Juniper Networks',
  model: 'SRX345',
  serialNumber: null,
  ipAddress: '192.168.50.1',
  location: 'Riyadh HQ – Security Lab',
  status: 'Inactive',
  firmwareVersion: '22.4R3',
  purchaseDate: null,
  notes: null,
  createdAt: '2026-09-05T11:15:00',
  updatedAt: '2026-09-20T08:45:00',
};

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  };
}

/** A fake fetch that answers each call with the next prepared response. */
function fakeFetch(...responses) {
  const fn = vi.fn();
  for (const r of responses) fn.mockResolvedValueOnce(r);
  return fn;
}

describe('apiFirewallService', () => {
  it('maps API records to the UI shape', () => {
    const fw = fromApi(apiFirewall);
    expect(fw.id).toBe('FW-0007');
    expect(fw.serialNumber).toBe('');
    expect(fw.purchaseDate).toBe('');
    expect(fw.notes).toBe('');
    expect(fw.firmwareVersion).toBe('22.4R3');
  });

  it('sends only editable fields, trimmed, with empty optional fields as null', () => {
    const body = toApiBody({
      id: 'FW-0001',
      createdAt: 'x',
      name: '  NEW-FW  ',
      manufacturer: 'Cisco',
      model: 'X',
      serialNumber: '  ',
      ipAddress: '10.0.0.9',
      location: 'HQ',
      status: 'Active',
      firmwareVersion: '',
      purchaseDate: '',
      notes: '',
    });
    expect(body).toEqual({
      name: 'NEW-FW',
      manufacturer: 'Cisco',
      model: 'X',
      serialNumber: null,
      ipAddress: '10.0.0.9',
      location: 'HQ',
      status: 'Active',
      firmwareVersion: null,
      purchaseDate: null,
      notes: null,
    });
  });

  it('requests a page with page, size and search parameters', async () => {
    const fetchFn = fakeFetch(
      response(200, { content: [apiFirewall], page: 1, size: 5, totalElements: 6, totalPages: 2 }),
    );
    const service = createApiFirewallService({ fetchFn });

    const page = await service.getPage({ page: 1, size: 5, search: ' lab ' });

    expect(fetchFn).toHaveBeenCalledWith(`${BASE}?page=1&size=5&search=lab`, expect.any(Object));
    expect(page).toMatchObject({ page: 1, size: 5, totalElements: 6, totalPages: 2 });
    expect(page.items[0].id).toBe('FW-0007');
  });

  it('omits the search parameter when there is no search text', async () => {
    const fetchFn = fakeFetch(response(200, { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 }));
    await createApiFirewallService({ fetchFn }).getPage();
    expect(fetchFn).toHaveBeenCalledWith(`${BASE}?page=0&size=10`, expect.any(Object));
  });

  it('gets a firewall by Asset ID and returns null when it does not exist', async () => {
    const fetchFn = fakeFetch(response(200, apiFirewall), response(404));
    const service = createApiFirewallService({ fetchFn });

    expect((await service.getById('FW-0007')).name).toBe('LAB-FW-01');
    expect(fetchFn).toHaveBeenLastCalledWith(`${BASE}/7`, expect.any(Object));
    expect(await service.getById('FW-0099')).toBeNull();
  });

  it('does not call the server for a value that is not an Asset ID', async () => {
    const fetchFn = vi.fn();
    const service = createApiFirewallService({ fetchFn });
    expect(await service.getById('abc')).toBeNull();
    expect(await service.remove('abc')).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('creates a firewall with POST and returns it', async () => {
    const fetchFn = fakeFetch(response(201, { ...apiFirewall, id: 11 }));
    const created = await createApiFirewallService({ fetchFn }).create({ name: 'LAB-FW-01' });

    const [url, options] = fetchFn.mock.calls[0];
    expect(url).toBe(BASE);
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body).name).toBe('LAB-FW-01');
    expect(created.id).toBe('FW-0011');
  });

  it('turns 400 and 409 field errors into a ValidationError', async () => {
    const fetchFn = fakeFetch(
      response(400, { status: 400, message: 'invalid', errors: { name: 'Name is required' } }),
      response(409, { status: 409, message: 'dup', errors: { ipAddress: 'This IP address is already assigned' } }),
    );
    const service = createApiFirewallService({ fetchFn });

    await expect(service.create({})).rejects.toMatchObject({
      name: 'ValidationError',
      errors: { name: 'Name is required' },
    });
    await expect(service.create({})).rejects.toMatchObject({
      name: 'ValidationError',
      errors: { ipAddress: 'This IP address is already assigned' },
    });
  });

  it('updates with PUT, then reads the saved record back', async () => {
    const fetchFn = fakeFetch(response(204), response(200, { ...apiFirewall, status: 'Active' }));
    const updated = await createApiFirewallService({ fetchFn }).update('FW-0007', { status: 'Active' });

    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/7`);
    expect(fetchFn.mock.calls[0][1].method).toBe('PUT');
    expect(fetchFn.mock.calls[1][0]).toBe(`${BASE}/7`);
    expect(updated.status).toBe('Active');
  });

  it('rejects updates to unknown firewalls with a NotFoundError', async () => {
    const fetchFn = fakeFetch(response(404, { status: 404, message: 'Firewall 9 was not found' }));
    await expect(createApiFirewallService({ fetchFn }).update('FW-0009', {})).rejects.toMatchObject({
      name: 'NotFoundError',
    });
  });

  it('deletes with DELETE: true when removed, false when not found', async () => {
    const fetchFn = fakeFetch(response(204), response(404, { status: 404, message: 'x' }));
    const service = createApiFirewallService({ fetchFn });

    expect(await service.remove('FW-0005')).toBe(true);
    expect(fetchFn.mock.calls[0]).toEqual([`${BASE}/5`, expect.objectContaining({ method: 'DELETE' })]);
    expect(await service.remove('FW-0005')).toBe(false);
  });

  it('reads the dashboard summary', async () => {
    const summary = { total: 10, byStatus: { Active: 6, Inactive: 2, Maintenance: 1, Decommissioned: 1 } };
    const fetchFn = fakeFetch(response(200, summary));
    expect(await createApiFirewallService({ fetchFn }).getSummary()).toEqual(summary);
    expect(fetchFn).toHaveBeenCalledWith(`${BASE}/summary`, expect.any(Object));
  });

  it('reports an unreachable server as an ApiError', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(createApiFirewallService({ fetchFn }).getSummary()).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
    });
  });

  it('reports other server errors as an ApiError with the status', async () => {
    const fetchFn = fakeFetch(response(500, { status: 500, message: 'Internal error' }));
    await expect(createApiFirewallService({ fetchFn }).getPage()).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Internal error',
    });
  });
});
