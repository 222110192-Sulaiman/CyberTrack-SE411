import { seedFirewalls } from '../data/seedFirewalls';
import { normalizeFirewall, validateFirewall } from '../utils/validation';
import { filterFirewalls } from '../utils/search';
import { EMPTY_FIREWALL, STATUSES } from '../data/constants';
import { formatAssetId, parseAssetId } from '../utils/assetId';
import { NotFoundError, ValidationError } from './errors';

export { NotFoundError, ValidationError };

const EDITABLE_FIELDS = Object.keys(EMPTY_FIREWALL);

function pickEditable(input) {
  const source = input ?? {};
  const result = {};
  for (const field of EDITABLE_FIELDS) result[field] = source[field] ?? '';
  return normalizeFirewall(result);
}

function highestIdNumber(firewalls) {
  return firewalls.reduce((acc, fw) => Math.max(acc, Number(fw.id.slice(3)) || 0), 0);
}

const formatId = formatAssetId;

/** Accepts "FW-0007" in any letter case. */
const normalizeId = (id) => {
  const n = parseAssetId(id);
  return n === null ? id : formatAssetId(n);
};

/** Newest first, matching the order the Spring API returns. */
const newestFirst = (a, b) => Number(b.id.slice(3)) - Number(a.id.slice(3));

/**
 * In-memory data-access layer for firewall assets.
 *
 * Part 1 used this as the application's data store. In Part 2 the app talks to the
 * Spring REST API (apiFirewallService.js); this implementation has the same methods and
 * is used by the frontend tests as a fast, isolated stand-in for the backend.
 * Records are copied on the way in and out so callers can never mutate the store.
 */
export function createFirewallService(initialData = seedFirewalls) {
  let firewalls = initialData.map((fw) => ({ ...fw }));
  // Only ever increases, so the ID of a deleted firewall is never reused.
  let lastIdNumber = highestIdNumber(firewalls);

  return {
    async getAll() {
      return firewalls.map((fw) => ({ ...fw }));
    },

    async getPage({ page = 0, size = 10, search = '' } = {}) {
      const matching = filterFirewalls(firewalls, search).sort(newestFirst);
      const start = page * size;
      return {
        items: matching.slice(start, start + size).map((fw) => ({ ...fw })),
        page,
        size,
        totalElements: matching.length,
        totalPages: Math.ceil(matching.length / size),
      };
    },

    async getSummary() {
      const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
      for (const fw of firewalls) byStatus[fw.status] = (byStatus[fw.status] ?? 0) + 1;
      return { total: firewalls.length, byStatus };
    },

    async getById(rawId) {
      const id = normalizeId(rawId);
      const found = firewalls.find((fw) => fw.id === id);
      return found ? { ...found } : null;
    },

    async create(input) {
      const data = pickEditable(input);
      const errors = validateFirewall(data, firewalls);
      if (Object.keys(errors).length) throw new ValidationError(errors);

      const now = new Date().toISOString();
      lastIdNumber += 1;
      const created = { id: formatId(lastIdNumber), ...data, createdAt: now, updatedAt: now };
      firewalls = [...firewalls, created];
      return { ...created };
    },

    async update(rawId, input) {
      const id = normalizeId(rawId);
      const existing = firewalls.find((fw) => fw.id === id);
      if (!existing) throw new NotFoundError(id);

      const data = pickEditable(input);
      const errors = validateFirewall(data, firewalls, id);
      if (Object.keys(errors).length) throw new ValidationError(errors);

      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      firewalls = firewalls.map((fw) => (fw.id === id ? updated : fw));
      return { ...updated };
    },

    async remove(rawId) {
      const id = normalizeId(rawId);
      const before = firewalls.length;
      firewalls = firewalls.filter((fw) => fw.id !== id);
      return firewalls.length < before;
    },

    async search(query) {
      return filterFirewalls(firewalls, query).map((fw) => ({ ...fw }));
    },
  };
}

export const firewallService = createFirewallService();
