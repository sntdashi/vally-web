import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX, Music, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect, ChangeEvent } from "react";

const PLAYLIST = [
  {
    title: "Clair de Lune",
    artist: "Claude Debussy",
    source: "https://upload.wikimedia.org/wikipedia/commons/9/96/Clair_de_lune.ogg",
    cover: "https://picsum.photos/seed/romantic1/200/200"
  },
  {
    title: "Gymnopédie No.1",
    artist: "Erik Satie",
    source: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Gymnopedie_No1.ogg",
    cover: "https://picsum.photos/seed/romantic2/200/200"
  },
  {
    title: "Nocturne Op.9 No.2",
    artist: "Frédéric Chopin",
    source: "https://upload.wikimedia.org/wikipedia/commons/1/10/Chopin_Nocturne_op9_No2.ogg",
    cover: "https://picsum.photos/seed/romantic3/200/200"
  }
];

export default function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(8).fill(0));
  const currentTrack = PLAYLIST[currentTrackIndex];

  const audioContextRef = useRef<AudioContext | null>(null);

  // Init AudioContext on first user gesture (required by mobile browsers)
  const initAudioContext = () => {
    if (audioRef.current && !analyserRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        // Resume if suspended (mobile autoplay policy)
        if (audioContext.state === 'suspended') audioContext.resume();
      } catch (e) {
        console.warn('AudioContext init failed:', e);
      }
    } else if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const updateVisualizer = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          // Get 8 bars of data
          const simplifiedData = Array.from(dataArray.slice(0, 8)).map(v => v / 255);
          setVisualizerData(simplifiedData);
        }
        animationRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setVisualizerData(new Array(8).fill(0));
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
    }
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (audioRef.current) {
      initAudioContext();
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    if (audioRef.current) {
      const newTime = (newProgress / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={18} />;
    if (volume < 50) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-50"
    >
      <audio
        ref={audioRef}
        src={currentTrack.source}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
      />

      <motion.div 
        layout
        className="glass-dark rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-3xl overflow-hidden"
        animate={{ 
          width: isMinimized ? "80px" : "320px",
          height: isMinimized ? "80px" : "auto"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          {!isMinimized ? (
            <motion.div
              key="maximized"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden group">
                    {/* Visualizer Bars */}
                    <div className="absolute inset-0 flex items-end justify-center gap-0.5 px-1 pb-1 opacity-50">
                      {visualizerData.map((val, i) => (
                        <motion.div
                          key={i}
                          className="w-full bg-romantic-blue rounded-t-sm"
                          animate={{ height: `${val * 100}%` }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      ))}
                    </div>
                    <img
                      src={currentTrack.cover}
                      alt="Album Art"
                      className={`relative z-10 w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-110 rotate-6' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 z-20 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Music size={20} className={isPlaying ? "animate-bounce" : ""} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-lg leading-tight truncate">{currentTrack.title}</h4>
                    <p className="opacity-40 text-xs font-mono uppercase tracking-widest mt-1">{currentTrack.artist}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors opacity-40 hover:opacity-100"
                >
                  <ChevronDown size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="relative h-1 bg-white/10 rounded-full group">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={handleProgressChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-romantic-blue to-romantic-cyan rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-40">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={handlePrevious}
                    className="opacity-40 hover:opacity-100 transition-opacity hover:scale-110"
                  >
                    <SkipBack size={20} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-romantic-blue text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>
                  <button 
                    onClick={handleNext}
                    className="opacity-40 hover:opacity-100 transition-opacity hover:scale-110"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-300"
                  >
                    {getVolumeIcon()}
                  </button>
                  <div className="flex-1 relative h-1 bg-white/10 rounded-full group cursor-pointer">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseInt(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-white/40 rounded-full group-hover:bg-romantic-blue group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-300"
                      animate={{ width: `${isMuted ? 0 : volume}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono opacity-40 w-6 text-right group-hover:opacity-100 transition-opacity">
                    {isMuted ? 0 : volume}%
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="minimized"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center cursor-pointer group"
              onClick={() => setIsMinimized(false)}
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                {/* Visualizer Bars (Minimized) */}
                <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2 opacity-30">
                  {visualizerData.slice(0, 4).map((val, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-romantic-blue rounded-full"
                      animate={{ height: `${val * 60 + 20}%` }}
                    />
                  ))}
                </div>
                <img
                  src={currentTrack.cover}
                  alt="Album Art"
                  className={`relative z-10 w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-110 rotate-12' : ''}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronUp size={20} />
                </div>
              </div>
              {isPlaying && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-romantic-blue rounded-full border-2 border-[#050505] animate-pulse" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
