import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Heart, Plus, Check, Trash2, Sparkles, Star, Globe, Coffee, Camera, Music, Home, Gamepad2, Plane } from "lucide-react";
import { supabase } from "../lib/supabase";

interface WishlistItem {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  sort_order: number;
  created_at?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <Sparkles size={14} /> },
  { id: 'date', label: 'Dates', icon: <Heart size={14} /> },
  { id: 'travel', label: 'Travel', icon: <Plane size={14} /> },
  { id: 'home', label: 'Home & Life', icon: <Home size={14} /> },
  { id: 'creative', label: 'Creative', icon: <Camera size={14} /> },
  { id: 'other', label: 'Other', icon: <Star size={14} /> },
];

const INITIAL_ITEMS: Omit<WishlistItem, 'created_at'>[] = [
  { id: crypto.randomUUID(), text: "Bikin banyak trend lucu estetik", completed: false, category: "creative", sort_order: 1 },
  { id: crypto.randomUUID(), text: "Gokart date", completed: false, category: "date", sort_order: 2 },
  { id: crypto.randomUUID(), text: "Aquarium date", completed: false, category: "date", sort_order: 3 },
  { id: crypto.randomUUID(), text: "Sushi date", completed: false, category: "date", sort_order: 4 },
  { id: crypto.randomUUID(), text: "Pecel lele/angkringan date", completed: false, category: "date", sort_order: 5 },
  { id: crypto.randomUUID(), text: "Main salju bikin boneka date", completed: false, category: "travel", sort_order: 6 },
  { id: crypto.randomUUID(), text: "Playground date", completed: false, category: "date", sort_order: 7 },
  { id: crypto.randomUUID(), text: "Disney date jadi Judy & Nick", completed: false, category: "date", sort_order: 9 },
  { id: crypto.randomUUID(), text: "Keliling Bandung cobain semua makanan viralnya", completed: false, category: "date", sort_order: 10 },
  { id: crypto.randomUUID(), text: "Cooking date", completed: false, category: "date", sort_order: 11 },
  { id: crypto.randomUUID(), text: "Pantai date", completed: false, category: "date", sort_order: 12 },
  { id: crypto.randomUUID(), text: "Bioskop date — nonton film random, review sambil bahas di rumah", completed: false, category: "date", sort_order: 13 },
  { id: crypto.randomUUID(), text: "Study date", completed: false, category: "date", sort_order: 14 },
  { id: crypto.randomUUID(), text: "Zoo date (kebun binatang)", completed: false, category: "date", sort_order: 15 },
  { id: crypto.randomUUID(), text: "Kita nikah 💍", completed: false, category: "home", sort_order: 16 },
  { id: crypto.randomUUID(), text: "Bikin time capsule", completed: false, category: "creative", sort_order: 17 },
  { id: crypto.randomUUID(), text: "Baking challenge / learn to cook", completed: false, category: "date", sort_order: 18 },
  { id: crypto.randomUUID(), text: "Bikin 'our playlist' di Spotify", completed: false, category: "creative", sort_order: 19 },
  { id: crypto.randomUUID(), text: "Bikin album foto berdua", completed: false, category: "creative", sort_order: 20 },
  { id: crypto.randomUUID(), text: "Library date", completed: false, category: "date", sort_order: 21 },
  { id: crypto.randomUUID(), text: "Random trip naik transportasi umum tanpa tujuan, berhenti sesuka kita", completed: false, category: "travel", sort_order: 22 },
  { id: crypto.randomUUID(), text: "Bikin kerajinan tangan apapun", completed: false, category: "creative", sort_order: 23 },
  { id: crypto.randomUUID(), text: "Beli rumah di daerah pedesaan yang adem tapi deket ke fasilitas", completed: false, category: "home", sort_order: 24 },
  { id: crypto.randomUUID(), text: "Bikin ruangan khusus kayak museum tentang kita berdua", completed: false, category: "home", sort_order: 26 },
  { id: crypto.randomUUID(), text: "Nonton konser kesukaan kita berdua", completed: false, category: "date", sort_order: 27 },
  { id: crypto.randomUUID(), text: "Belajar hal baru apapun, sesuka kita dengan bebas", completed: false, category: "other", sort_order: 28 },
  { id: crypto.randomUUID(), text: "Bikin vlog seharian", completed: false, category: "creative", sort_order: 29 },
  { id: crypto.randomUUID(), text: "Bikin video random yang estetik berdua", completed: false, category: "creative", sort_order: 30 },
  { id: crypto.randomUUID(), text: "Cafe cat/dog date", completed: false, category: "date", sort_order: 31 },
  { id: crypto.randomUUID(), text: "Main game stories berdua di studio sendiri, sampe puas", completed: false, category: "home", sort_order: 32 },
  { id: crypto.randomUUID(), text: "Pelihara kucing", completed: false, category: "home", sort_order: 33 },
  { id: crypto.randomUUID(), text: "Bikin scrapbook bareng", completed: false, category: "creative", sort_order: 34 },
  { id: crypto.randomUUID(), text: "Bikin custom parfume berdua — cuma ada satu di dunia, cuma kita yang tau resepnya", completed: false, category: "creative", sort_order: 35 },
  { id: crypto.randomUUID(), text: "Main sampan / eksplorasi hutan berdua sambil bikin vlog", completed: false, category: "travel", sort_order: 36 },
  { id: crypto.randomUUID(), text: "Bikin memory jar — tiap abis date nulis di kertas, dibuka tiap tahun baru", completed: false, category: "creative", sort_order: 37 },
  { id: crypto.randomUUID(), text: "Mandangin bintang berdua di padang rumput malam, bawa tikar", completed: false, category: "date", sort_order: 38 },
  { id: crypto.randomUUID(), text: "Main ke kebun teh, ikut petik", completed: false, category: "travel", sort_order: 39 },
  { id: crypto.randomUUID(), text: "Main kembang api berdua di hari-hari penting", completed: false, category: "other", sort_order: 40 },
  { id: crypto.randomUUID(), text: "Punya taman sendiri — bunga, buah, sayur, lengkap", completed: false, category: "home", sort_order: 41 },
  { id: crypto.randomUUID(), text: "Ternak ayam, bebek, sapi", completed: false, category: "home", sort_order: 42 },
  { id: crypto.randomUUID(), text: "Lihat aurora langsung berdua", completed: false, category: "travel", sort_order: 43 },
  { id: crypto.randomUUID(), text: "Keliling dunia ke berbagai negara", completed: false, category: "travel", sort_order: 44 },
  { id: crypto.randomUUID(), text: "Ke negara kucing — Islandia", completed: false, category: "travel", sort_order: 45 },
  { id: crypto.randomUUID(), text: "Bikin buket sendiri dari bunga pilihan kita", completed: false, category: "creative", sort_order: 46 },
  { id: crypto.randomUUID(), text: "Bikin love map — pin & tandai setiap tempat yang pernah kita kunjungi", completed: false, category: "creative", sort_order: 47 },
  { id: crypto.randomUUID(), text: "Nungguin sunset berdua sambil ngobrol random", completed: false, category: "date", sort_order: 48 },
  { id: crypto.randomUUID(), text: "Custom phone wallpaper challenge", completed: false, category: "creative", sort_order: 49 },
  { id: crypto.randomUUID(), text: "Planning big trip — riset & susun rencana negara berikutnya", completed: false, category: "travel", sort_order: 50 },
  { id: crypto.randomUUID(), text: "Gym / olahraga bareng", completed: false, category: "other", sort_order: 51 },
  { id: crypto.randomUUID(), text: "Jalan santai keliling desa minggu pagi / sepedaan bareng", completed: false, category: "date", sort_order: 52 },
  { id: crypto.randomUUID(), text: "Bikin baju couple sendiri — custom atau pelukan pakai cat", completed: false, category: "creative", sort_order: 53 },
  { id: crypto.randomUUID(), text: "Ajarin Pikri merajut, belajar sama-sama", completed: false, category: "creative", sort_order: 55 },
  { id: crypto.randomUUID(), text: "The last first date — keliling Cirebon", completed: false, category: "date", sort_order: 56 },
  { id: crypto.randomUUID(), text: "Cobain nasi kucing", completed: false, category: "date", sort_order: 57 },
  { id: crypto.randomUUID(), text: "Punya secret code berdua yang artinya 'I love you'", completed: false, category: "other", sort_order: 58 },
  { id: crypto.randomUUID(), text: "Berbulan-bulan di Jepang, nikmatin musim semi & gugur, datengin spot anime berdua", completed: false, category: "travel", sort_order: 59 },
  { id: crypto.randomUUID(), text: "Kalau punya rumah — date ke toko bangunan kayak Ikea, beli perabot, atur konsep berdua", completed: false, category: "home", sort_order: 60 },
  { id: crypto.randomUUID(), text: "Hidup sehat sama-sama", completed: false, category: "other", sort_order: 61 },
  { id: crypto.randomUUID(), text: "Belajar bahasa baru bersama", completed: false, category: "other", sort_order: 62 },
];

export default function WishlistVault() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('date');
  const [seeded, setSeeded] = useState(false);

  // Fetch from Supabase
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .order('completed', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) { console.error(error); setLoading(false); return; }

    // If empty, seed with initial items
    if (data && data.length === 0 && !seeded) {
      setSeeded(true);
      const { error: insertError } = await supabase.from('wishlist').insert(INITIAL_ITEMS);
      if (!insertError) {
        const { data: seededData } = await supabase.from('wishlist').select('*').order('sort_order');
        setItems(seededData || []);
      }
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    // Real-time sync
    const channel = supabase
      .channel('wishlist-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const toggleItem = async (item: WishlistItem) => {
    const newCompleted = !item.completed;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: newCompleted } : i));
    await supabase.from('wishlist').update({ completed: newCompleted }).eq('id', item.id);
  };

  const addItem = async () => {
    if (!newItemText.trim()) return;
    const newItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      completed: false,
      category: newItemCategory,
      sort_order: Date.now(),
    };
    setItems(prev => [...prev, newItem]);
    setNewItemText('');
    setShowAddForm(false);
    await supabase.from('wishlist').insert(newItem);
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('wishlist').delete().eq('id', id);
  };

  const filtered = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory);
  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <section id="wishlist" className="py-24 px-4 md:px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
          <Star size={16} className="text-romantic-cyan" />
          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">Our Bucket List</span>
        </motion.div>
        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-4">Wishlist Kita 💙</h2>
        <p className="opacity-50 text-sm mb-8">Semua yang mau kita lakuin berdua, satu per satu</p>

        {/* Progress bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-xs font-mono opacity-50 mb-2">
            <span>{completedCount} done</span>
            <span>{totalCount - completedCount} remaining</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }}
            />
          </div>
          <p className="text-xs font-mono opacity-30 mt-2">{Math.round(progress)}% of our adventure unlocked</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none justify-start md:justify-center">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-romantic-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                : 'glass hover:bg-white/10 opacity-60 hover:opacity-100'
            }`}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40 opacity-30">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Heart size={32} className="text-romantic-blue" />
          </motion.div>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.02 }}
                className={`group flex items-start gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  item.completed
                    ? 'bg-romantic-blue/10 border-romantic-blue/20'
                    : 'glass border-white/5 hover:border-white/15'
                }`}
                onClick={() => toggleItem(item)}
              >
                {/* Checkbox */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  item.completed
                    ? 'bg-romantic-blue border-romantic-blue shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : 'border-white/20 group-hover:border-romantic-blue/50'
                }`}>
                  <AnimatePresence>
                    {item.completed && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check size={13} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Text */}
                <p className={`flex-1 text-sm leading-relaxed transition-all duration-300 ${
                  item.completed ? 'line-through opacity-40' : 'opacity-80'
                }`}>
                  {item.text}
                </p>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-30 hover:!opacity-80 transition-all p-1 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add new item */}
      <div className="mt-8">
        <AnimatePresence>
          {showAddForm ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="glass rounded-2xl p-5 border border-white/10">
              <p className="text-xs font-mono uppercase tracking-widest opacity-50 mb-3">Add to wishlist</p>
              <textarea
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                placeholder="Sesuatu yang mau kita lakuin..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm resize-none outline-none focus:border-romantic-blue/50 transition-colors placeholder:opacity-30 mb-3"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addItem(); }}
              />
              <div className="flex gap-2 flex-wrap mb-4">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button key={cat.id} onClick={() => setNewItemCategory(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                      newItemCategory === cat.id
                        ? 'bg-romantic-blue text-white'
                        : 'glass opacity-50 hover:opacity-100'
                    }`}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl glass text-sm opacity-60 hover:opacity-100 transition-all">
                  Cancel
                </button>
                <button onClick={addItem} disabled={!newItemText.trim()}
                  className="px-5 py-2 rounded-xl bg-romantic-blue text-white font-bold text-sm flex items-center gap-2 disabled:opacity-40 hover:scale-105 transition-all">
                  <Plus size={14} /> Add
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setShowAddForm(true)}
              className="w-full py-4 rounded-2xl glass border border-dashed border-white/20 hover:border-romantic-blue/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2 opacity-50 hover:opacity-100"
            >
              <Plus size={16} />
              <span className="text-sm font-bold">Add new wish</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
