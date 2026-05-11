import { supabase } from './supabase';

export interface VallyConfig {
  names: { person1: string; person2: string };
  relationship: { startDate: string; anniversaryDate: string };
  stats: { memoriesCount: string; placesVisited: string };
}

const DEFAULTS: VallyConfig = {
  names: { person1: 'You', person2: 'Vally' },
  relationship: { startDate: '2023-06-12', anniversaryDate: '06-12' },
  stats: { memoriesCount: '1,240+', placesVisited: '12' },
};

// Local cache
let _cache: VallyConfig | null = null;

export function getConfig(): VallyConfig {
  if (_cache) return _cache;
  try {
    const stored = localStorage.getItem('vally_config');
    _cache = stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    return _cache;
  } catch { return DEFAULTS; }
}

// Fetch config from Supabase and sync to localStorage
export async function fetchConfig(): Promise<VallyConfig> {
  try {
    const { data } = await supabase.from('config').select('key, value');
    if (!data || data.length === 0) return getConfig();

    const remote: Record<string, string> = {};
    data.forEach(row => { remote[row.key] = row.value; });

    const merged: VallyConfig = { ...DEFAULTS };
    if (remote.names) merged.names = JSON.parse(remote.names);
    if (remote.relationship) merged.relationship = JSON.parse(remote.relationship);
    if (remote.stats) merged.stats = JSON.parse(remote.stats);

    _cache = merged;
    localStorage.setItem('vally_config', JSON.stringify(merged));
    return merged;
  } catch {
    return getConfig();
  }
}

// Save config both locally and to Supabase
export async function saveConfig(updates: Partial<VallyConfig>): Promise<void> {
  const current = getConfig();
  const merged = { ...current, ...updates };
  _cache = merged;
  localStorage.setItem('vally_config', JSON.stringify(merged));

  // Upsert each section to Supabase config table
  const rows = Object.entries(merged).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
  }));

  for (const row of rows) {
    await supabase.from('config').upsert(row, { onConflict: 'key' });
  }
}

export function getDaysTogether(): number {
  const config = getConfig();
  const start = new Date(config.relationship.startDate);
  return Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function getNextAnniversary(): Date {
  const config = getConfig();
  const [month, day] = config.relationship.anniversaryDate.split('-').map(Number);
  const now = new Date();
  let anniversary = new Date(now.getFullYear(), month - 1, day);
  if (now > anniversary) anniversary = new Date(now.getFullYear() + 1, month - 1, day);
  return anniversary;
}
