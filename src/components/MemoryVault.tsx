import { motion, AnimatePresence, useScroll, useTransform, Reorder, useDragControls } from "motion/react";
import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { X, Maximize2, Plus, ZoomIn, ZoomOut, RotateCcw, Loader2, Image as ImageIcon, Play, CheckCircle2, Music, Volume2, VolumeX, Film, Scissors, Save, Trash2, Share2, Link, Twitter, Send, Copy, Check, Download, Map as MapIcon, LayoutGrid, MapPin, Upload, GripVertical } from "lucide-react";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { fetchMemories, uploadMemory, deleteMemories, updateMemory, reorderMemories, subscribeToMemories, type Memory } from "../lib/memories";

// Use Memory type from lib/memories
type MemoryItem = Memory;

interface ParallaxMediaProps {
  item: MemoryItem;
  index: number;
  onClick: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  type: 'image' | 'video';
}

function ParallaxMedia({ item, index, onClick, isSelected, isSelectionMode, onSelect, onTrim }: ParallaxMediaProps & { onTrim: (e: React.MouseEvent) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragControls = useDragControls();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  useEffect(() => {
    if (item.type === 'video' && videoRef.current) {
      const video = videoRef.current;
      const handleTimeUpdate = () => {
        if (item.end_time && video.currentTime >= item.end_time) {
          video.currentTime = item.start_time || 0;
        }
      };
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [item]);

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.1 }}
      className={`relative group cursor-pointer rounded-3xl overflow-hidden glass border-none mb-6 h-fit transition-all duration-300 ${
        isSelected ? "ring-4 ring-romantic-blue scale-[0.98]" : ""
      }`}
      onClick={onClick}
      onMouseEnter={() => {
        if (item.type === 'video' && videoRef.current) {
          videoRef.current.currentTime = item.start_time || 0;
          videoRef.current.play();
        }
      }}
      onMouseLeave={() => item.type === 'video' && videoRef.current?.pause()}
    >
      <div ref={ref} className="relative overflow-hidden h-full min-h-[200px]">
        {item.type === 'image' ? (
          <motion.img
            src={item.url}
            alt="Memory"
            style={{ y, scale: 1.3 }}
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.4]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <motion.div style={{ y, scale: 1.1 }} className="relative w-full h-full">
            <video
              ref={videoRef}
              src={item.url}
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 z-10 p-2 rounded-full glass-dark flex items-center gap-2">
              <Play size={16} fill="white" className="text-white" />
              {(item.start_time !== undefined || item.end_time !== undefined) && (
                <span className="text-[10px] font-mono font-bold text-romantic-cyan">TRIMMED</span>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Drag Handle */}
      {!isSelectionMode && (
        <div 
          className="absolute top-4 left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity p-2 glass rounded-xl cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical size={20} className="text-white" />
        </div>
      )}
      
      {isSelectionMode && (
        <div 
          className="absolute top-4 right-4 z-20"
          onClick={onSelect}
        >
          <div className={`p-1 rounded-full backdrop-blur-md border transition-all ${
            isSelected ? "bg-romantic-blue border-romantic-blue text-white" : "bg-black/20 border-white/20 text-white/40"
          }`}>
            <CheckCircle2 size={24} />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
        {!isSelectionMode && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-full glass">
              {item.type === 'video' ? <Play size={24} fill="white" /> : <Maximize2 size={24} />}
            </div>
            {item.type === 'video' && (
              <button 
                onClick={onTrim}
                className="p-3 rounded-full glass hover:bg-romantic-blue/20 transition-colors flex items-center justify-center"
                title="Trim Video"
              >
                <Scissors size={20} className="text-white" />
              </button>
            )}
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}

function VideoTrimmer({ item, onSave, onCancel }: { item: MemoryItem, onSave: (start: number, end: number) => void, onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(item.start_time || 0);
  const [end, setEnd] = useState(item.end_time || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        if (!item.end_time) setEnd(video.duration);
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [item]);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        if (video.currentTime >= end) {
          video.pause();
          setIsPlaying(false);
          video.currentTime = start;
        }
      };
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [start, end]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (videoRef.current.currentTime >= end || videoRef.current.currentTime < start) {
          videoRef.current.currentTime = start;
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <div className="glass w-full max-w-4xl rounded-[3rem] overflow-hidden flex flex-col border-white/10 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-serif font-bold">Trim Memory</h3>
            <p className="text-sm opacity-40">Select the perfect moment to preserve.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 bg-black/40 relative flex items-center justify-center min-h-[300px]">
          <video 
            ref={videoRef}
            src={item.url}
            className="max-h-[50vh] w-full object-contain"
          />
          <button 
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="p-6 rounded-full glass opacity-0 group-hover:opacity-100 transition-opacity">
              {isPlaying ? <VolumeX size={32} /> : <Play size={32} fill="white" />}
            </div>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-mono uppercase tracking-widest opacity-40">
              <span>Start: {start.toFixed(1)}s</span>
              <span>Current: {currentTime.toFixed(1)}s</span>
              <span>End: {end.toFixed(1)}s</span>
            </div>
            
            <div className="relative h-12 flex items-center">
              {/* Range Track */}
              <div className="absolute inset-0 h-2 bg-white/5 rounded-full top-1/2 -translate-y-1/2" />
              
              {/* Active Range */}
              <div 
                className="absolute h-2 bg-romantic-blue rounded-full top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                style={{ 
                  left: `${(start / duration) * 100}%`, 
                  right: `${100 - (end / duration) * 100}%` 
                }}
              />

              {/* Start Handle */}
              <input 
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={start}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStart(Math.min(val, end - 0.5));
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {/* End Handle */}
              <input 
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={end}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEnd(Math.max(val, start + 0.5));
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {/* Visual Handles */}
              <div 
                className="absolute w-4 h-4 bg-white rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-lg"
                style={{ left: `${(start / duration) * 100}%` }}
              />
              <div 
                className="absolute w-4 h-4 bg-white rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-lg"
                style={{ left: `${(end / duration) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={onCancel}
              className="flex-1 px-6 py-4 rounded-2xl glass hover:bg-white/5 font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(start, end)}
              className="flex-1 px-6 py-4 rounded-2xl bg-romantic-blue text-white font-bold hover:scale-[1.02] transition-all shadow-lg shadow-romantic-blue/20 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Trim
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ShareModal({ selectedCount, onCancel }: { selectedCount: number, onCancel: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://eternal.love/share/${Math.random().toString(36).substring(7)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialPlatforms = [
    { name: 'Twitter', icon: <Twitter size={20} />, color: 'bg-[#1DA1F2]', link: `https://twitter.com/intent/tweet?text=Check out our memories!&url=${shareUrl}` },
    { name: 'WhatsApp', icon: <Send size={20} />, color: 'bg-[#25D366]', link: `https://wa.me/?text=Check out our memories! ${shareUrl}` },
    { name: 'Telegram', icon: <Send size={20} />, color: 'bg-[#0088cc]', link: `https://t.me/share/url?url=${shareUrl}&text=Check out our memories!` },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass w-full max-w-md rounded-[3rem] overflow-hidden border-white/10 shadow-2xl p-8"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-serif font-bold">Share Memories</h3>
            <p className="text-sm opacity-40">Share {selectedCount} selected items.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-widest opacity-40">Unique Link</label>
            <div className="flex gap-2">
              <div className="flex-1 glass bg-white/5 rounded-2xl px-4 py-3 text-sm font-mono truncate border border-white/5">
                {shareUrl}
              </div>
              <button 
                onClick={handleCopy}
                className={`p-3 rounded-2xl transition-all ${copied ? 'bg-green-500 text-white' : 'glass hover:bg-white/10'}`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-4 rounded-3xl glass hover:bg-white/10 transition-all group"
              >
                <div className={`p-3 rounded-2xl ${platform.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  {platform.icon}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">{platform.name}</span>
              </a>
            ))}
          </div>

          <button 
            onClick={onCancel}
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all mt-4"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmationModal({ count, onConfirm, onCancel }: { count: number, onConfirm: () => void, onCancel: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass w-full max-w-md rounded-[3rem] overflow-hidden border-white/10 shadow-2xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 size={40} />
        </div>
        
        <h3 className="text-2xl font-serif font-bold mb-2 text-white">Delete Memories?</h3>
        <p className="text-sm opacity-60 mb-8 leading-relaxed">
          Are you sure you want to delete {count} selected {count === 1 ? 'memory' : 'memories'}? 
          This action cannot be undone and these moments will be lost forever.
        </p>

        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl glass hover:bg-white/10 font-bold transition-all"
          >
            Keep Them
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            Yes, Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MemoryVault() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selected, setSelected] = useState<MemoryItem | null>(null);
  const [scale, setScale] = useState(1);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [trimmingItem, setTrimmingItem] = useState<MemoryItem | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch memories from Supabase on mount + subscribe to real-time changes
  useEffect(() => {
    fetchMemories().then(data => {
      setMemories(data);
      setLoading(false);
    }).catch(() => setLoading(false));

    const unsub = subscribeToMemories(() => {
      fetchMemories().then(setMemories);
    });
    // Wrap in sync function — unsubscribe() returns a Promise but useEffect cleanup must be sync
    return () => { unsub(); };
  }, []);

  const processFiles = React.useCallback((files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(async (file: File) => {
      const uploadId = Math.random().toString(36).slice(2);
      const type: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';
      const newUpload: UploadingFile = { id: uploadId, name: file.name, progress: 0, type };
      setUploadingFiles(prev => [newUpload, ...prev]);

      try {
        const memory = await uploadMemory(file, (pct) => {
          setUploadingFiles(prev => prev.map(u => u.id === uploadId ? { ...u, progress: pct } : u));
        });
        setMemories(prev => [memory, ...prev]);
        setUploadingFiles(prev => prev.filter(u => u.id !== uploadId));
        if (type === 'video') setTrimmingItem(memory);
      } catch (err) {
        console.error('Upload failed', err);
        setUploadingFiles(prev => prev.filter(u => u.id !== uploadId));
      }
    });
  }, []);

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleTrimSave = async (start: number, end: number) => {
    if (trimmingItem) {
      setMemories(prev => prev.map(m =>
        m.id === trimmingItem.id ? { ...m, start_time: start, end_time: end } : m
      ));
      await updateMemory(trimmingItem.id, { start_time: start, end_time: end });
      setTrimmingItem(null);
    }
  };

  const handleDelete = async () => {
    const toDelete = memories.filter(m => selectedIds.includes(m.id));
    const paths = toDelete.map(m => m.storage_path);
    setMemories(prev => prev.filter(m => !selectedIds.includes(m.id)));
    setSelectedIds([]);
    setShowDeleteModal(false);
    setIsSelectionMode(false);
    await deleteMemories(selectedIds, paths);
  };

  const handleDownload = () => {
    const selectedItems = memories.filter(m => selectedIds.includes(m.id));
    selectedItems.forEach((item, index) => {
      const link = document.createElement('a');
      link.href = item.url;
      link.download = `memory-${item.id}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
      }, index * 100);
    });
  };

  const toggleSelection = React.useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const startSlideshow = () => {
    if (selectedIds.length > 0) {
      setCurrentSlide(0);
      setShowSlideshow(true);
    }
  };

  const selectedMemories = memories.filter(m => selectedIds.includes(m.id));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showSlideshow && selectedIds.length > 0) {
      interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % selectedIds.length);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showSlideshow, selectedIds.length]);

  // (memories are now persisted via Supabase — no localStorage needed)

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));
  const handleReset = () => setScale(1);

  const handleSetLocation = (lat: number, lng: number) => {
    setTempLocation(prev => ({
      lat,
      lng,
      name: prev?.name || "Custom Location"
    }));
  };

  const saveLocation = () => {
    if (selected && tempLocation) {
      setMemories(prev => prev.map(m => 
        m.id === selected.id ? { ...m, location: tempLocation } : m
      ));
      setSelected(prev => prev ? { ...prev, location: tempLocation } : null);
      setIsSettingLocation(false);
    }
  };

  return (
    <section 
      id="memories" 
      className="py-24 px-6 max-w-7xl mx-auto relative z-10"
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-romantic-blue/20 backdrop-blur-md flex items-center justify-center p-12 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass p-12 rounded-[4rem] border-2 border-dashed border-romantic-blue flex flex-col items-center gap-6 shadow-2xl"
            >
              <div className="w-24 h-24 rounded-full bg-romantic-blue/20 flex items-center justify-center text-romantic-blue animate-bounce">
                <Upload size={48} />
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-serif font-bold mb-2">Drop to Upload</h3>
                <p className="opacity-60">Release your files to add them to the vault.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-4">Memory Vault</h2>
          <p className="opacity-60">A curated collection of our digital footprints.</p>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-4">
          <div className="flex glass p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? "bg-romantic-blue text-white shadow-lg shadow-romantic-blue/20" : "hover:bg-white/5 opacity-40"}`}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? "bg-romantic-blue text-white shadow-lg shadow-romantic-blue/20" : "hover:bg-white/5 opacity-40"}`}
              title="Map View"
            >
              <MapIcon size={20} />
            </button>
          </div>

          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
            className={`px-4 py-3 md:px-6 rounded-2xl font-bold transition-all text-sm md:text-base ${
              isSelectionMode ? "bg-white/10 text-white" : "glass hover:bg-white/10"
            }`}
          >
            {isSelectionMode ? "Cancel Selection" : "Select Memories"}
          </button>

          <button
            onClick={async () => {
              if (confirm("Are you sure you want to clear all memories? This cannot be undone.")) {
                const allIds = memories.map(m => m.id);
                const allPaths = memories.map(m => m.storage_path);
                setMemories([]);
                await deleteMemories(allIds, allPaths);
              }
            }}
            className="p-3 rounded-2xl glass hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all border border-red-500/10"
            title="Clear All Memories (Free Up Space)"
          >
            <Trash2 size={20} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*,video/*"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 md:px-6 rounded-2xl bg-romantic-blue hover:bg-romantic-blue/80 text-white font-bold transition-all shadow-lg shadow-romantic-blue/20 group text-sm md:text-base"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Upload
          </button>
        </div>
      </div>

      {isSelectionMode && selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 glass p-3 md:p-4 rounded-3xl flex flex-wrap items-center justify-center gap-3 md:gap-6 shadow-2xl border-romantic-blue/20 w-[90%] md:w-auto max-w-2xl"
        >
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-romantic-blue flex items-center justify-center text-[10px] md:text-xs font-bold">
              {selectedIds.length}
            </div>
            <span className="text-xs md:text-sm font-medium">Selected</span>
          </div>
          <button
            onClick={startSlideshow}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl bg-romantic-blue text-white font-bold hover:scale-105 transition-transform text-xs md:text-sm"
          >
            <Play size={16} fill="currentColor" className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Play Slideshow</span>
            <span className="sm:hidden">Play</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl glass text-white font-bold hover:scale-105 transition-transform border-romantic-blue/30 text-xs md:text-sm"
          >
            <Share2 size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl glass text-white font-bold hover:scale-105 transition-transform border-white/10 text-xs md:text-sm"
          >
            <Download size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-2xl glass text-red-400 font-bold hover:scale-105 transition-transform border-red-500/20 hover:bg-red-500/10 text-xs md:text-sm"
          >
            <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </motion.div>
      )}

      {viewMode === 'grid' ? (
        <Reorder.Group 
          axis="y" 
          values={memories} 
          onReorder={setMemories}
          className="columns-1 md:columns-2 lg:columns-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {uploadingFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="relative rounded-3xl overflow-hidden glass border-romantic-blue/30 p-8 mb-6 break-inside-avoid flex flex-col items-center justify-center min-h-[240px]"
              >
                <div className="relative mb-6 w-full flex flex-col items-center">
                  <div className="relative">
                    {file.type === 'video' ? (
                      <div className="relative">
                        <Film size={64} className="text-romantic-blue/10" />
                        {/* Scanning Line */}
                        <motion.div 
                          className="absolute left-0 right-0 bg-romantic-cyan z-10"
                          animate={{ 
                            top: ["0%", "100%", "0%", "30%", "70%", "0%"],
                            height: ["1px", "4px", "1px", "2px", "1px"],
                            opacity: [0.4, 1, 0.4, 0.9, 0.4],
                            boxShadow: [
                              "0 0 10px rgba(34,211,238,0.4)",
                              "0 0 30px rgba(34,211,238,1)",
                              "0 0 10px rgba(34,211,238,0.4)"
                            ]
                          }}
                          transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: "easeInOut",
                            times: [0, 0.25, 0.5, 0.65, 0.85, 1] 
                          }}
                        />
                        {/* Analysis Grid Overlay */}
                        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0.5 opacity-20">
                          {Array.from({ length: 16 }).map((_, i) => {
                            const duration = 0.6 + (i % 4) * 0.3;
                            const delay = (i % 6) * 0.15;
                            return (
                              <motion.div 
                                key={i}
                                className="bg-romantic-blue"
                                animate={{ 
                                  opacity: [0.05, 0.85, 0.05],
                                  scale: [1, 1.25, 1],
                                  backgroundColor: i % 3 === 0 ? "#22d3ee" : "#3b82f6",
                                  filter: i % 5 === 0 ? ["blur(0px)", "blur(4px)", "blur(0px)"] : "none"
                                }}
                                transition={{ 
                                  duration: duration, 
                                  repeat: Infinity, 
                                  delay: delay,
                                  ease: "easeInOut"
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <ImageIcon size={64} className="text-romantic-blue/10" />
                        {/* Building Grid for Images */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <motion.div 
                              key={i}
                              className="bg-romantic-blue/40 rounded-sm"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ 
                                scale: file.progress > (i * 11) ? 1 : 0,
                                opacity: file.progress > (i * 11) ? 0.6 : 0,
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            />
                          ))}
                        </div>
                        {/* Reconstruction Scan */}
                        <motion.div 
                          className="absolute top-0 bottom-0 w-0.5 bg-romantic-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          animate={{ left: ["0%", "100%", "0%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                    )}
                    
                    <motion.div 
                      className="absolute -bottom-2 -right-2 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Loader2 size={16} className="text-romantic-cyan animate-spin" />
                    </motion.div>
                  </div>

                  {file.type === 'video' && (
                    <div className="mt-6 flex gap-1 justify-center w-full px-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="h-8 w-full rounded-md bg-white/5 border border-white/5 overflow-hidden relative"
                        >
                          {file.progress > (i * 12.5) && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-romantic-blue/20 flex items-center justify-center"
                            >
                              <div className="w-1 h-1 rounded-full bg-romantic-cyan animate-pulse" />
                            </motion.div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-romantic-cyan animate-pulse">
                      {file.type === 'video' ? "Analyzing Frames" : "Optimizing Image"}
                    </span>
                  </div>
                  <p className="text-xs font-mono uppercase tracking-widest opacity-40 mb-4 truncate px-4">
                    {file.name}
                  </p>
                  <div className="px-6">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                      <motion.div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-romantic-blue to-romantic-cyan shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <p className="text-[10px] font-mono opacity-20">
                        {file.type === 'video' ? "Quantum Encoding" : "Bitstream Transfer"}
                      </p>
                      <p className="text-[10px] font-mono text-romantic-cyan font-bold">
                        {file.progress}%
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {memories.map((item, index) => (
            <ParallaxMedia 
              key={item.id} 
              item={item} 
              index={index} 
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(item.id)}
              onSelect={(e) => {
                e.stopPropagation();
                toggleSelection(item.id);
              }}
              onTrim={(e) => {
                e.stopPropagation();
                setTrimmingItem(item);
              }}
              onClick={() => {
                if (isSelectionMode) {
                  toggleSelection(item.id);
                } else {
                  setSelected(item);
                  setScale(1);
                }
              }} 
            />
          ))}
        </Reorder.Group>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-[70vh] w-full rounded-[3rem] overflow-hidden glass border-white/10 relative"
        >
          <Map 
            defaultCenter={[20, 0]} 
            defaultZoom={2}
            boxClassname="relative"
          >
            <ZoomControl />
            {memories.filter(m => m.location).map((item) => (
              <Marker 
                key={item.id}
                width={50}
                anchor={[item.location!.lat, item.location!.lng]} 
                onClick={() => setSelected(item)}
              >
                <div className="relative group cursor-pointer">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black/90 rounded-xl p-2 shadow-xl scale-0 group-hover:scale-100 transition-transform origin-bottom z-50 whitespace-nowrap">
                    <p className="text-[10px] font-bold text-white">{item.location?.name || 'Memory'}</p>
                  </div>
                  {/* SVG pin — no external image, no CSP issue */}
                  <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="16" cy="37" rx="6" ry="3" fill="rgba(0,0,0,0.3)" />
                    <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 25 12 25S28 21 28 12C28 5.373 22.627 0 16 0Z" fill="#3b82f6" />
                    <circle cx="16" cy="12" r="6" fill="white" fillOpacity="0.9" />
                    <path d="M16 9c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3Z" fill="#3b82f6" />
                  </svg>
                </div>
              </Marker>
            ))}
          </Map>
          <div className="absolute top-8 left-8 glass p-4 rounded-2xl z-10">
            <h3 className="text-lg font-serif font-bold">Global Memories</h3>
            <p className="text-xs opacity-40">Exploring our journey across the world.</p>
          </div>
        </motion.div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal 
            selectedCount={selectedIds.length}
            onCancel={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteConfirmationModal 
            count={selectedIds.length}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Trimmer Modal */}
      <AnimatePresence>
        {trimmingItem && (
          <VideoTrimmer 
            item={trimmingItem}
            onSave={handleTrimSave}
            onCancel={() => setTrimmingItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
            onClick={() => setSelected(null)}
          >
            <div className="absolute top-6 right-6 flex items-center gap-4 z-[110]">
              {selected.type === 'image' && (
                <div className="flex items-center gap-2 glass-dark p-2 rounded-2xl">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut size={20} />
                  </button>
                  <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn size={20} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    title="Reset"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              )}
              <button
                className="p-3 rounded-full glass-dark hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = selected.url;
                  link.download = `memory-${selected.id}.${selected.type === 'video' ? 'mp4' : 'jpg'}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                title="Download"
              >
                <Download size={24} />
              </button>
              <button
                className="p-3 rounded-full glass-dark hover:bg-white/10 transition-colors"
                onClick={() => setSelected(null)}
              >
                <X size={24} />
              </button>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {selected.type === 'image' ? (
                <motion.img
                  src={selected.url}
                  alt="Full memory"
                  drag={scale > 1}
                  dragConstraints={{ left: -500 * scale, right: 500 * scale, top: -500 * scale, bottom: 500 * scale }}
                  dragElastic={0.1}
                  animate={{ scale }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`max-w-full max-h-full object-contain ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    src={selected.url}
                    controls
                    autoPlay
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      if (selected.start_time) video.currentTime = selected.start_time;
                    }}
                    onTimeUpdate={(e) => {
                      const video = e.currentTarget;
                      if (selected.end_time && video.currentTime >= selected.end_time) {
                        video.pause();
                      }
                    }}
                    className="max-w-full max-h-full rounded-2xl shadow-2xl"
                  />
                  <button 
                    onClick={() => setTrimmingItem(selected)}
                    className="absolute bottom-8 right-8 glass p-4 rounded-2xl flex items-center gap-2 hover:bg-romantic-blue/20 transition-all group"
                  >
                    <Scissors size={20} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-bold">Edit Trim</span>
                  </button>
                  <button 
                    onClick={() => {
                      setTempLocation(selected.location || { lat: 20, lng: 0, name: "" });
                      setIsSettingLocation(true);
                    }}
                    className="absolute bottom-8 left-8 glass p-4 rounded-2xl flex items-center gap-2 hover:bg-romantic-blue/20 transition-all group"
                  >
                    <MapPin size={20} className="group-hover:bounce transition-transform" />
                    <span className="text-sm font-bold">{selected.location ? selected.location.name : "Set Location"}</span>
                  </button>
                </div>
              )}
            </motion.div>
            
            {isSettingLocation && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-12"
              >
                <div className="glass w-full max-w-2xl rounded-[3rem] overflow-hidden flex flex-col border-white/10 shadow-2xl">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-serif font-bold">Set Memory Location</h3>
                      <p className="text-sm opacity-40">Click the map or type a name manually.</p>
                    </div>
                    <button onClick={() => setIsSettingLocation(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="p-6 bg-white/5 border-b border-white/5">
                    <label className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2 block">Location Name (City, Country)</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-romantic-blue" size={18} />
                      <input 
                        type="text" 
                        value={tempLocation?.name || ""}
                        onChange={(e) => setTempLocation(prev => prev ? { ...prev, name: e.target.value } : { lat: 20, lng: 0, name: e.target.value })}
                        placeholder="e.g. Paris, France"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-romantic-blue/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="h-[350px] relative">
                    <Map 
                      defaultCenter={tempLocation ? [tempLocation.lat, tempLocation.lng] : [20, 0]} 
                      defaultZoom={2}
                      onClick={({ latLng }) => handleSetLocation(latLng[0], latLng[1])}
                      boxClassname="relative"
                    >
                      <ZoomControl />
                      {tempLocation && (
                        <Marker width={40} anchor={[tempLocation.lat, tempLocation.lng]} />
                      )}
                    </Map>
                  </div>
                  <div className="p-6 flex gap-4">
                    <button 
                      onClick={() => setIsSettingLocation(false)}
                      className="flex-1 py-3 rounded-2xl glass hover:bg-white/5 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveLocation}
                      className="flex-1 py-3 rounded-2xl bg-romantic-blue text-white font-bold hover:bg-romantic-blue/80 transition-all shadow-lg shadow-romantic-blue/20"
                    >
                      Save Location
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs font-mono uppercase tracking-widest hidden md:block">
              {selected.type === 'image' ? (scale > 1 ? "Drag to pan • Use controls to zoom" : "Click outside to close") : "Video Playback Mode"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slideshow Player */}
      <AnimatePresence>
        {showSlideshow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black flex items-center justify-center overflow-hidden"
          >
            <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
              <div className="flex items-center gap-4">
                <div className="glass-dark px-4 py-2 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-romantic-blue animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest">Slideshow Mode</span>
                </div>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="glass-dark p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
              <button
                onClick={() => setShowSlideshow(false)}
                className="glass-dark p-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {selectedMemories[currentSlide] && (
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {selectedMemories[currentSlide].type === 'image' ? (
                    <>
                      <img
                        src={selectedMemories[currentSlide].url}
                        alt={`Slide ${currentSlide + 1}`}
                        className="w-full h-full object-cover opacity-60 blur-sm scale-110 absolute inset-0"
                        referrerPolicy="no-referrer"
                      />
                      <img
                        src={selectedMemories[currentSlide].url}
                        alt={`Slide ${currentSlide + 1}`}
                        className="relative z-10 max-w-[90%] max-h-[80vh] object-contain shadow-2xl rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </>
                  ) : (
                    <video
                      src={selectedMemories[currentSlide].url}
                      autoPlay
                      muted={isMuted}
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        if (selectedMemories[currentSlide].start_time) {
                          video.currentTime = selectedMemories[currentSlide].start_time;
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.currentTarget;
                        const item = selectedMemories[currentSlide];
                        if (item.end_time && video.currentTime >= item.end_time) {
                          video.currentTime = item.start_time || 0;
                        }
                      }}
                      className="relative z-10 max-w-[90%] max-h-[80vh] object-contain shadow-2xl rounded-2xl"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {selectedIds.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 transition-all duration-500 rounded-full ${
                    i === currentSlide ? "w-8 bg-romantic-blue" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>

            <div className="absolute bottom-8 left-8 flex items-center gap-3 opacity-40 z-20">
              <Music size={16} />
              <span className="text-[10px] font-mono uppercase tracking-widest">
                {isMuted ? "Music Muted" : "Playing Romantic Background Score"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
