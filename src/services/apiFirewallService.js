import { EMPTY_FIREWALL } from '../data/constants';
import { formatAssetId, parseAssetId } from '../utils/assetId';
import { ApiError, NotFoundError, ValidationError } from './errors';

/** Relative URL: in development Vite forwards /api to the Spring server (see vite.config.js). */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1/firewalls';

const EDITABLE_FIELDS = Object.keys(EMPTY_FIREWALL);
const OPTIONAL_FIELDS = ['serialNumber', 'firmwareVersion', 'purchaseDate', 'notes'];

/** Converts a firewall from the API (numeric id, null optional fields) to the shape the UI uses. */
export function fromApi(firewall) {
  const result = { ...firewall, id: formatAssetId(firewall.id) };
  for (const field of OPTIONAL_FIELDS) result[field] = firewall[field] ?? '';
  return result;
}

/** Builds the JSON body for POST/PUT: only editable fields, trimmed, empty optional fields as null. */
export function toApiBody(input) {
  const source = input ?? {};
  const body = {};
  for (const field of EDITABLE_FIELDS) {
    const raw = source[field] ?? '';
    const value = typeof raw === 'string' ? raw.trim() : raw;
    body[field] = OPTIONAL_FIELDS.includes(field) && value === '' ? null : value;
  }
  return body;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Data-access layer backed by the CyberTrack Spring REST API.
 * It has the same methods as the in-memory service, so the pages work with either.
 */
export function createApiFirewallService({ baseUrl = API_BASE_URL, fetchFn = (...args) => fetch(...args) } = {}) {
  async function request(path, options = {}) {
    let response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, {
        ...options,
        headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
      });
    } catch {
      throw new ApiError('The CyberTrack server could not be reached', 0);
    }
    return response;
  }

  async function failure(response) {
    const body = await readJson(response);
    if ((response.status === 400 || response.status === 409) && body?.errors && Object.keys(body.errors).length) {
      return new ValidationError(body.errors);
    }
    return new ApiError(body?.message ?? `Request failed (${response.status})`, response.status);
  }

  return {
    /** One page of firewalls, newest first. `page` starts at 0. */
    async getPage({ page = 0, size = 10, search = '' } = {}) {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      if (search.trim()) params.set('search', search.trim());
      const response = await request(`?${params}`);
      if (!response.ok) throw await failure(response);
      const data = await response.json();
      return {
        items: data.content.map(fromApi),
        page: data.page,
        size: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
      };
    },

    /** The firewall with this Asset ID (e.g. "FW-0007"), or null when there is none. */
    async getById(assetId) {
      const id = parseAssetId(assetId);
      if (id === null) return null;
      const response = await request(`/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw await failure(response);
      return fromApi(await response.json());
    },

    async getSummary() {
      const response = await request('/summary');
      if (!response.ok) throw await failure(response);
      return response.json();
    },

    async create(input) {
      const response = await request('', { method: 'POST', body: JSON.stringify(toApiBody(input)) });
      if (!response.ok) throw await failure(response);
      return fromApi(await response.json());
    },

    async update(assetId, input) {
      const id = parseAssetId(assetId);
      if (id === null) throw new NotFoundError(assetId);
      const response = await request(`/${id}`, { method: 'PUT', body: JSON.stringify(toApiBody(input)) });
      if (response.status === 404) throw new NotFoundError(assetId);
      if (!response.ok) throw await failure(response);
      // PUT answers 204 No Content, so read the saved record back.
      const updated = await this.getById(assetId);
      if (!updated) throw new NotFoundError(assetId);
      return updated;
    },

    /** Resolves true when deleted, false when the firewall did not exist. */
    async remove(assetId) {
      const id = parseAssetId(assetId);
      if (id === null) return false;
      const response = await request(`/${id}`, { method: 'DELETE' });
      if (response.status === 404) return false;
      if (!response.ok) throw await failure(response);
      return true;
    },
  };
}

export const apiFirewallService = createApiFirewallService();
