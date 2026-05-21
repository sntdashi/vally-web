import { motion, useScroll, useTransform } from "motion/react";
import { Heart, Clock, MapPin, Stars, Plus, Pencil, Trash2, X, Check, Upload, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface TimelineEvent {
  id: string;
  date_label: string;
  title: string;
  description: string;
  icon_type: string;
  image_url: string | null;
  storage_path: string | null;
  sort_order: number;
  lat: number | null;
  lng: number | null;
  location_name: string | null;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Heart className="text-romantic-blue" size={20} />,
  mappin: <MapPin className="text-romantic-blue" size={20} />,
  stars: <Stars className="text-romantic-blue" size={20} />,
  clock: <Clock className="text-romantic-blue" size={20} />,
};

async function uploadTimelinePhoto(file: File): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop();
  const path = `timeline/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('memories').upload(path, file, { contentType: file.type });
  if (error) { console.error(error); return null; }
  const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(path);
  return { url: publicUrl, path };
}

function TimelineItem({
  event, index, onEdit, onDelete
}: {
  event: TimelineEvent;
  index: number;
  onEdit: (e: TimelineEvent) => void;
  onDelete: (id: string, path: string | null) => void;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-60, 60]);
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${
        index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Photo card */}
      <div className="flex-1 w-full relative">
        <div className="glass rounded-3xl overflow-hidden group relative">
          <div className="relative h-56 md:h-80 overflow-hidden bg-white/5">
            {event.image_url ? (
              <motion.img
                style={{ y }}
                src={event.image_url}
                alt={event.title}
                className="absolute inset-0 w-full h-[140%] object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Heart size={48} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 md:left-6">
              <span className="text-romantic-blue font-mono text-xs md:text-sm uppercase tracking-widest">
                {event.date_label}
              </span>
            </div>

            {/* Edit/Delete buttons on hover */}
            <motion.div
              animate={{ opacity: hover ? 1 : 0 }}
              className="absolute top-3 right-3 flex gap-2"
            >
              <button
                onClick={() => onEdit(event)}
                className="p-2 rounded-xl bg-black/60 hover:bg-romantic-blue/80 transition-colors backdrop-blur-sm"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(event.id, event.storage_path)}
                className="p-2 rounded-xl bg-black/60 hover:bg-red-500/80 transition-colors backdrop-blur-sm"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          </div>

          {/* Text */}
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-romantic-blue/10">
                {ICON_MAP[event.icon_type] || ICON_MAP.heart}
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-serif font-bold">{event.title}</h3>
                {event.location_name && (
                  <p className="text-[10px] font-mono opacity-40 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {event.location_name}
                  </p>
                )}
              </div>
            </div>
            <p className="opacity-60 text-sm leading-relaxed">{event.description}</p>
          </div>
        </div>
      </div>

      {/* Timeline dot */}
      <div className="hidden md:flex flex-col items-center gap-2 flex-shrink-0">
        <div className="w-4 h-4 rounded-full bg-romantic-blue shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
        <div className="w-px h-24 bg-gradient-to-b from-romantic-blue to-transparent" />
      </div>

      {/* Spacer */}
      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

function EventForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<TimelineEvent>;
  onSave: (data: Partial<TimelineEvent>) => void;
  onCancel: () => void;
}) {
  const [dateLabel, setDateLabel] = useState(initial?.date_label || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [desc, setDesc] = useState(initial?.description || '');
  const [iconType, setIconType] = useState(initial?.icon_type || 'heart');
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '');
  const [storagePath, setStoragePath] = useState(initial?.storage_path || '');
  const [locationName, setLocationName] = useState(initial?.location_name || '');
  const [lat, setLat] = useState(initial?.lat?.toString() || '');
  const [lng, setLng] = useState(initial?.lng?.toString() || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadTimelinePhoto(file);
    if (result) {
      setImageUrl(result.url);
      setStoragePath(result.path);
    }
    setUploading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 border border-romantic-blue/20 space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1">Date</label>
          <input value={dateLabel} onChange={e => setDateLabel(e.target.value)}
            placeholder="June 12, 2023"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50" />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1">Icon</label>
          <select value={iconType} onChange={e => setIconType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50">
            <option value="heart">❤️ Heart</option>
            <option value="mappin">📍 Map Pin</option>
            <option value="stars">⭐ Stars</option>
            <option value="clock">🕐 Clock</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Our first date"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50" />
      </div>

      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1">Story</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="What made this moment special..."
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50 resize-none" />
      </div>

      {/* Photo */}
      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1">Photo</label>
        <div className="flex gap-2">
          {imageUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img src={imageUrl} className="w-full h-full object-cover" />
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-1 py-3 rounded-xl glass border border-dashed border-white/20 hover:border-romantic-blue/40 transition-all flex items-center justify-center gap-2 text-xs opacity-60 hover:opacity-100"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : imageUrl ? 'Change photo' : 'Upload photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 block mb-1">Location (optional — shows on map)</label>
        <input value={locationName} onChange={e => setLocationName(e.target.value)}
          placeholder="e.g. Bandung, Indonesia"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50 mb-2" />
        <div className="grid grid-cols-2 gap-2">
          <input value={lat} onChange={e => setLat(e.target.value)}
            placeholder="Latitude (e.g. -6.89)"
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50" />
          <input value={lng} onChange={e => setLng(e.target.value)}
            placeholder="Longitude (e.g. 107.61)"
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-romantic-blue/50" />
        </div>
        <p className="text-[9px] opacity-30 mt-1">Tip: cari di Google Maps → klik lokasi → copy koordinatnya</p>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl glass text-sm opacity-60 hover:opacity-100">Cancel</button>
        <button
          onClick={() => onSave({
            date_label: dateLabel, title, description: desc, icon_type: iconType,
            image_url: imageUrl || null, storage_path: storagePath || null,
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            location_name: locationName || null,
          })}
          disabled={!title || !dateLabel}
          className="px-5 py-2 rounded-xl bg-romantic-blue text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
        >
          <Check size={14} /> Save
        </button>
      </div>
    </motion.div>
  );
}

export default function LoveTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchEvents = async () => {
    const { data } = await supabase.from('timeline_events').select('*').order('sort_order');
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    const channel = supabase.channel('timeline-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timeline_events' }, fetchEvents)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const handleAdd = async (data: Partial<TimelineEvent>) => {
    await supabase.from('timeline_events').insert({
      id: crypto.randomUUID(),
      date_label: data.date_label!,
      title: data.title!,
      description: data.description!,
      icon_type: data.icon_type || 'heart',
      image_url: data.image_url || null,
      storage_path: data.storage_path || null,
      sort_order: Date.now(),
    });
    setShowAddForm(false);
    fetchEvents();
  };

  const handleEdit = async (data: Partial<TimelineEvent>) => {
    if (!editingEvent) return;
    await supabase.from('timeline_events').update(data).eq('id', editingEvent.id);
    setEditingEvent(null);
    fetchEvents();
  };

  const handleDelete = async (id: string, path: string | null) => {
    if (!confirm('Delete this moment?')) return;
    if (path) await supabase.storage.from('memories').remove([path]);
    await supabase.from('timeline_events').delete().eq('id', id);
    fetchEvents();
  };

  return (
    <section id="timeline" className="py-16 md:py-24 px-4 md:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12 md:mb-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
          <Heart size={16} className="text-romantic-blue" />
          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Our Story</span>
        </motion.div>
        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-4">Our Journey</h2>
        <p className="opacity-50 text-sm">A cinematic walkthrough of our most precious moments.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 opacity-30">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="space-y-16 md:space-y-24">
          {events.map((event, index) => (
            editingEvent?.id === event.id ? (
              <EventForm key={event.id} initial={event}
                onSave={handleEdit} onCancel={() => setEditingEvent(null)} />
            ) : (
              <TimelineItem key={event.id} event={event} index={index}
                onEdit={setEditingEvent} onDelete={handleDelete} />
            )
          ))}

          {/* Add form */}
          {showAddForm ? (
            <EventForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
          ) : (
            <motion.button
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              onClick={() => setShowAddForm(true)}
              className="w-full py-6 rounded-3xl glass border border-dashed border-white/20 hover:border-romantic-blue/40 hover:bg-white/5 transition-all flex items-center justify-center gap-3 opacity-50 hover:opacity-100"
            >
              <Plus size={20} />
              <span className="font-serif italic text-lg">Add a new moment</span>
            </motion.button>
          )}
        </div>
      )}
    </section>
  );
}
