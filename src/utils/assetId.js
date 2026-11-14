const ASSET_ID_PATTERN = /^FW-(\d{1,9})$/i;

/** 7 -> "FW-0007". The backend stores a numeric id; the UI shows it as an Asset ID. */
export function formatAssetId(id) {
  return `FW-${String(id).padStart(4, '0')}`;
}

/** "FW-0007" (any letter case, surrounding spaces allowed) -> 7. Returns null for anything else. */
export function parseAssetId(value) {
  const match = ASSET_ID_PATTERN.exec(String(value ?? '').trim());
  if (!match) return null;
  const id = Number(match[1]);
  return id > 0 ? id : null;
}

export function isAssetId(value) {
  return parseAssetId(value) !== null;
}
