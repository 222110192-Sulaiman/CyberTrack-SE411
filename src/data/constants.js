export const MANUFACTURERS = [
  'Cisco',
  'Fortinet',
  'Palo Alto Networks',
  'Check Point',
  'Juniper Networks',
  'SonicWall',
  'Sophos',
  'Other',
];

export const STATUSES = ['Active', 'Inactive', 'Maintenance', 'Decommissioned'];

export const DEFAULT_STATUS = 'Active';

/** Empty values for the Add Firewall form. */
export const EMPTY_FIREWALL = {
  name: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  ipAddress: '',
  location: '',
  status: DEFAULT_STATUS,
  firmwareVersion: '',
  purchaseDate: '',
  notes: '',
};

/** User-editable fields, in form order (used to focus the first invalid field). */
export const FIREWALL_FIELDS = Object.keys(EMPTY_FIREWALL);
