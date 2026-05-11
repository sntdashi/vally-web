import { supabase } from './supabase';

export interface Memory {
  id: string;
  type: 'image' | 'video';
  url: string;
  storage_path: string | null;
  location?: { lat: number; lng: number; name?: string } | null;
  start_time?: number | null;
  end_time?: number | null;
  sort_order: number;
  created_at?: string;
}

const BUCKET = 'memories';

// Fetch all memories ordered by sort_order
export async function fetchMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('sort_order', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    url: row.url,
    storage_path: row.storage_path,
    location: row.location_lat != null
      ? { lat: row.location_lat, lng: row.location_lng!, name: row.location_name ?? undefined }
      : null,
    start_time: row.start_time,
    end_time: row.end_time,
    sort_order: row.sort_order,
    created_at: row.created_at,
  }));
}

// Upload a file to Supabase Storage and insert metadata row
export async function uploadMemory(
  file: File,
  onProgress: (pct: number) => void
): Promise<Memory> {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const type: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';

  // Upload in chunks to simulate progress (Supabase JS doesn't expose XHR progress natively)
  onProgress(10);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;
  onProgress(80);

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  // Insert into memories table
  const { data, error } = await supabase
    .from('memories')
    .insert({
      id: crypto.randomUUID(),
      type,
      url: publicUrl,
      storage_path: path,
      sort_order: Date.now(),
    })
    .select()
    .single();

  if (error) throw error;
  onProgress(100);

  return {
    id: data.id,
    type: data.type,
    url: data.url,
    storage_path: data.storage_path,
    sort_order: data.sort_order,
    created_at: data.created_at,
  };
}

// Delete memories and their storage files
export async function deleteMemories(ids: string[], paths: (string | null)[]): Promise<void> {
  // Delete storage files
  const validPaths = paths.filter(Boolean) as string[];
  if (validPaths.length > 0) {
    await supabase.storage.from(BUCKET).remove(validPaths);
  }
  // Delete DB rows
  await supabase.from('memories').delete().in('id', ids);
}

// Update memory metadata (location, trim times, order)
export async function updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
  const row: Record<string, any> = {};
  if (updates.location !== undefined) {
    row.location_lat = updates.location?.lat ?? null;
    row.location_lng = updates.location?.lng ?? null;
    row.location_name = updates.location?.name ?? null;
  }
  if (updates.start_time !== undefined) row.start_time = updates.start_time;
  if (updates.end_time !== undefined) row.end_time = updates.end_time;
  if (updates.sort_order !== undefined) row.sort_order = updates.sort_order;

  await supabase.from('memories').update(row).eq('id', id);
}

// Reorder memories (update sort_order for all)
export async function reorderMemories(memories: Memory[]): Promise<void> {
  const updates = memories.map((m, i) => ({
    id: m.id,
    sort_order: memories.length - i,
  }));
  for (const u of updates) {
    await supabase.from('memories').update({ sort_order: u.sort_order }).eq('id', u.id);
  }
}

// Subscribe to real-time memory changes
export function subscribeToMemories(callback: () => void) {
  const channel = supabase
    .channel('memories-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, callback)
    .subscribe();
  return () => channel.unsubscribe();
}
