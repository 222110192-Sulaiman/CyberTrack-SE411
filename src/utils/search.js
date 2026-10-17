const SEARCH_FIELDS = ['id', 'name', 'manufacturer', 'ipAddress', 'location'];

/** Case-insensitive substring match on the searchable firewall fields (FR-SRC-02). */
export function matchesQuery(firewall, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return SEARCH_FIELDS.some((field) => String(firewall[field] ?? '').toLowerCase().includes(q));
}

export function filterFirewalls(firewalls, query) {
  return firewalls.filter((fw) => matchesQuery(fw, query));
}
