import { FIREWALL_FIELDS, MANUFACTURERS, STATUSES } from '../data/constants';

const IPV4_OCTET = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IPV4_PATTERN = new RegExp(`^${IPV4_OCTET}(\\.${IPV4_OCTET}){3}$`);
const NAME_PATTERN = /^[A-Za-z0-9 ._-]+$/;
const SERIAL_PATTERN = /^[A-Za-z0-9-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIPv4(value) {
  return IPV4_PATTERN.test(value);
}

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function todayISODate() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Trims every string field so validation and storage see the same values. */
export function normalizeFirewall(input) {
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = typeof value === 'string' ? value.trim() : value;
  }
  return result;
}

/**
 * Validates firewall input against the rules in the requirements analysis (Section 4.3).
 * @param {object} input        Firewall field values.
 * @param {object[]} existing   Current firewalls, for uniqueness checks.
 * @param {string|null} currentId  ID of the firewall being edited (excluded from uniqueness checks).
 * @returns {Record<string,string>} Field name -> error message. Empty when valid.
 */
export function validateFirewall(input, existing = [], currentId = null) {
  // Every field must be text (or missing). Other types are rejected, not converted,
  // so the rules below always work on strings and nothing unexpected is stored.
  const v = {};
  const typeErrors = {};
  for (const field of FIREWALL_FIELDS) {
    const value = input?.[field] ?? '';
    if (typeof value === 'string') {
      v[field] = value.trim();
    } else {
      v[field] = '';
      typeErrors[field] = 'Invalid value: text expected';
    }
  }

  const others = existing.filter((fw) => fw.id !== currentId);
  const errors = {};

  const name = v.name ?? '';
  if (!name) errors.name = 'Name is required';
  else if (name.length < 2 || name.length > 50) errors.name = 'Name must be 2–50 characters';
  else if (!NAME_PATTERN.test(name))
    errors.name = 'Name may contain only letters, digits, spaces, hyphens, underscores and dots';
  else if (others.some((fw) => fw.name.toLowerCase() === name.toLowerCase()))
    errors.name = 'A firewall with this name already exists';

  if (!MANUFACTURERS.includes(v.manufacturer)) errors.manufacturer = 'Select a manufacturer';

  const model = v.model ?? '';
  if (!model) errors.model = 'Model is required';
  else if (model.length > 50) errors.model = 'Model cannot exceed 50 characters';

  const serial = v.serialNumber ?? '';
  if (serial.length > 40) errors.serialNumber = 'Serial number cannot exceed 40 characters';
  else if (serial && !SERIAL_PATTERN.test(serial))
    errors.serialNumber = 'Serial number may contain only letters, digits and hyphens';

  const ip = v.ipAddress ?? '';
  if (!ip) errors.ipAddress = 'IP address is required';
  else if (!isValidIPv4(ip)) errors.ipAddress = 'Enter a valid IPv4 address (e.g. 192.168.1.1)';
  else if (others.some((fw) => fw.ipAddress === ip))
    errors.ipAddress = 'This IP address is already assigned';

  const location = v.location ?? '';
  if (!location) errors.location = 'Location is required';
  else if (location.length < 2 || location.length > 100)
    errors.location = 'Location must be 2–100 characters';

  if (!STATUSES.includes(v.status)) errors.status = 'Select a status';

  if ((v.firmwareVersion ?? '').length > 20)
    errors.firmwareVersion = 'Firmware version cannot exceed 20 characters';

  const date = v.purchaseDate ?? '';
  if (date) {
    if (!isValidDate(date)) errors.purchaseDate = 'Enter a valid date';
    else if (date > todayISODate()) errors.purchaseDate = 'Purchase date cannot be in the future';
  }

  if ((v.notes ?? '').length > 500) errors.notes = 'Notes cannot exceed 500 characters';

  return { ...errors, ...typeErrors };
}
