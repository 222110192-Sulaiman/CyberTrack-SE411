import { seedFirewalls } from '../data/seedFirewalls';
import { normalizeFirewall, validateFirewall } from '../utils/validation';
import { filterFirewalls } from '../utils/search';
import { EMPTY_FIREWALL } from '../data/constants';

export class ValidationError extends Error {
  constructor(errors) {
    super('Firewall data is invalid');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends Error {
  constructor(id) {
    super(`Firewall ${id} was not found`);
    this.name = 'NotFoundError';
  }
}

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

const formatId = (n) => `FW-${String(n).padStart(4, '0')}`;

/**
 * Data-access layer for firewall assets.
 *
 * Part 1 keeps the collection in memory. Every method returns a Promise so that
 * Part 2 can replace the implementation with HTTP calls without changing the UI.
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

    async getById(id) {
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

    async update(id, input) {
      const existing = firewalls.find((fw) => fw.id === id);
      if (!existing) throw new NotFoundError(id);

      const data = pickEditable(input);
      const errors = validateFirewall(data, firewalls, id);
      if (Object.keys(errors).length) throw new ValidationError(errors);

      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      firewalls = firewalls.map((fw) => (fw.id === id ? updated : fw));
      return { ...updated };
    },

    async remove(id) {
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
