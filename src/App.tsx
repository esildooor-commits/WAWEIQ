import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Search, 
  Heart, 
  Radio, 
  Settings, 
  ListMusic,
  Globe,
  Zap,
  SkipForward,
  SkipBack,
  History as HistoryIcon,
  Sparkles,
  ShieldCheck,
  BarChart3,
  MapPin,
  X,
  Wifi,
  WifiOff,
  Timer,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Station, PlayerState, HistoryItem, UserProfile } from './types';
import { CURATED_STATIONS } from './constants';

// --- Components ---

const Visualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const bars = 40;
    const barWidth = canvas.width / bars;
    const heights = new Array(bars).fill(0).map(() => Math.random() * 40);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < bars; i++) {
        if (isPlaying) {
          const target = Math.random() * (canvas.height - 10) + 5;
          heights[i] += (target - heights[i]) * 0.15;
        } else {
          heights[i] *= 0.85;
          if (heights[i] < 2) heights[i] = 2;
        }

        const x = i * barWidth;
        const h = heights[i];
        const y = canvas.height - h;
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#00ff41');
        gradient.addColorStop(0.5, '#008f11');
        gradient.addColorStop(1, '#003b00');
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 255, 65, 0.5)';
        ctx.fillStyle = gradient;
        
        // Draw rounded bars
        const radius = (barWidth - 2) / 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x + 1, y, barWidth - 2, h, [radius, radius, 0, 0]);
        } else {
          ctx.rect(x + 1, y, barWidth - 2, h);
        }
        ctx.fill();
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={100} 
      className="w-full h-24 opacity-90"
    />
  );
};

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  quality, 
  onQualityChange,
  userLocation,
  uuid,
  eqGains,
  onEqChange,
  onResetEq,
  sleepTimer,
  onSleepTimerChange
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  quality: 'high' | 'low';
  onQualityChange: (q: 'high' | 'low') => void;
  userLocation: { country?: string; city?: string };
  uuid: string;
  eqGains: number[];
  onEqChange: (index: number, value: number) => void;
  onResetEq: () => void;
  sleepTimer: number | null;
  onSleepTimerChange: (minutes: number | null) => void;
}) => {
  const [isEqExpanded, setIsEqExpanded] = React.useState(false);
  const eqLabels = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'];
  const timerOptions = [
    { label: 'Off', value: null },
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '60m', value: 60 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]"
          />
          
          {/* Bottom Sheet / Settings Menu */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 150) onClose();
            }}
            className="fixed left-0 bottom-0 right-0 z-[101] bg-hw-panel/98 backdrop-blur-xl overflow-y-auto flex flex-col p-8 custom-scrollbar max-h-[90vh]"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Settings className="text-hw-accent" />
                Settings
              </h3>
              <button onClick={onClose} className="text-hw-muted hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 overflow-y-auto max-h-[90vh] pr-2 custom-scrollbar">
              {/* Sleep Timer */}
              <div>
                <label className="text-xs uppercase tracking-widest text-hw-muted font-mono mb-4 flex items-center gap-2">
                  <Timer size={14} className="text-hw-accent" />
                  Sleep Timer
                </label>
                <div className="flex flex-wrap gap-2">
                  {timerOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => onSleepTimerChange(opt.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hw-border ${
                        sleepTimer === opt.value 
                          ? 'bg-hw-accent text-black border-hw-accent' 
                          : 'bg-black/20 text-hw-muted hover:bg-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {sleepTimer && (
                  <p className="text-[10px] text-hw-accent mt-2 font-mono uppercase tracking-tighter">
                    Timer Active: {sleepTimer}m remaining
                  </p>
                )}
              </div>

              {/* Equalizer */}
              <div>
                <button 
                  onClick={() => setIsEqExpanded(!isEqExpanded)}
                  className="w-full flex items-center justify-between text-xs uppercase tracking-widest text-hw-muted font-mono mb-4"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-hw-accent" />
                    Audio Equalizer
                  </span>
                  {isEqExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isEqExpanded && (
                  <div className="space-y-4 bg-black/20 p-4 rounded-2xl hw-border">
                    {eqGains.map((gain, i) => (
                      <div key={eqLabels[i]} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-hw-muted">
                          <span>{eqLabels[i]}</span>
                          <span className={gain !== 0 ? 'text-hw-accent' : ''}>{gain > 0 ? `+${gain}` : gain}dB</span>
                        </div>
                        <input 
                          type="range" 
                          min="-12" 
                          max="12" 
                          step="1"
                          value={gain}
                          onChange={(e) => onEqChange(i, parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-hw-accent"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        onResetEq();
                        setIsEqExpanded(false);
                      }}
                      className="w-full py-2 text-[10px] uppercase font-mono text-hw-muted hover:text-hw-accent transition-colors"
                    >
                      Reset to Flat
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-hw-muted font-mono mb-4 block">Audio Quality</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => onQualityChange('high')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl hw-border transition-all ${quality === 'high' ? 'bg-hw-accent/20 border-hw-accent' : 'bg-black/20 hover:bg-white/5'}`}
                  >
                    <Wifi className={quality === 'high' ? 'text-hw-accent' : 'text-hw-muted'} />
                    <div className="text-center">
                      <p className="font-bold text-sm">High Quality</p>
                      <p className="text-[10px] text-hw-muted">Best for good reception</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => onQualityChange('low')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl hw-border transition-all ${quality === 'low' ? 'bg-hw-accent/20 border-hw-accent' : 'bg-black/20 hover:bg-white/5'}`}
                  >
                    <WifiOff className={quality === 'low' ? 'text-hw-accent' : 'text-hw-muted'} />
                    <div className="text-center">
                      <p className="font-bold text-sm">Low Quality</p>
                      <p className="text-[10px] text-hw-muted">Saves data / Poor signal</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-hw-muted font-mono">System Info</label>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl hw-border">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-hw-accent" />
                      <span className="text-xs font-mono text-hw-text">{userLocation.city || 'Unknown'}, {userLocation.country || 'Unknown'}</span>
                    </div>
                    <ShieldCheck size={14} className="text-hw-accent" />
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl hw-border">
                    <p className="text-[10px] text-hw-muted font-mono mb-1">USER ID</p>
                    <p className="text-xs font-mono text-hw-accent truncate">{uuid}</p>
                  </div>
                </div>
                <p className="text-[10px] text-hw-muted text-center">WaveIQ Radio v1.2.0 • Privacy First</p>
              </div>
              
              {/* Bottom Padding Fix */}
              <div className="h-[50px] shrink-0" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const GENRES = ['Jazz', 'Techno', 'News', 'Pop', 'Rock', 'Classical', 'Electronic', 'Chill', 'Dance', 'Metal', '80s', '90s', 'Country', 'Hip Hop', 'Ambient', 'Blues', 'Reggae', 'World'];
const COUNTRIES = [
  { name: 'Germany', code: 'DE' },
  { name: 'USA', code: 'US' },
  { name: 'UK', code: 'GB' },
  { name: 'France', code: 'FR' },
  { name: 'Italy', code: 'IT' },
  { name: 'Spain', code: 'ES' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Japan', code: 'JP' },
  { name: 'Canada', code: 'CA' },
  { name: 'Australia', code: 'AU' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Switzerland', code: 'CH' },
  { name: 'Austria', code: 'AT' },
  { name: 'Poland', code: 'PL' },
  { name: 'Turkey', code: 'TR' },
  { name: 'Russia', code: 'RU' },
];

type Tab = 'featured' | 'trending' | 'top100' | 'discover' | 'favorites' | 'history' | 'insights' | 'smart_shuffle';

// Multi-Source Provider Logic (Proxied via Server)
const getApiUrl = () => '/api/radio-browser';

const checkStreamReachability = async (url: string): Promise<boolean> => {
  if (!url) return false;
  
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.pls') || lowerUrl.endsWith('.m3u') || lowerUrl.endsWith('.m3u8') || lowerUrl.endsWith('.asx')) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('/api/check-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) return false;
    const data = await response.json();
    return data.reachable;
  } catch (e) {
    return false;
  }
};

const StationCard = ({ station, currentStationId, isPlaying, onSelect, onToggleFavorite, isFavorite }: { 
  station: Station; 
  currentStationId?: string; 
  isPlaying: boolean; 
  onSelect: (s: Station) => void; 
  onToggleFavorite: (s: Station) => void;
  isFavorite: boolean;
  key?: any;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    onClick={() => onSelect(station)}
    className={`group relative p-4 rounded-2xl hw-border cursor-pointer transition-all hover:bg-white/5 ${
      currentStationId === station.id ? 'bg-hw-accent/10 border-hw-accent/30' : 'bg-hw-panel'
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center overflow-hidden hw-border">
        {station.favicon ? (
          <img src={station.favicon} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <Radio className="text-hw-muted" size={24} />
        )}
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(station);
        }}
        className={`p-2 rounded-full transition-colors ${
          isFavorite ? 'text-hw-accent' : 'text-hw-muted hover:text-white'
        }`}
      >
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
    
    <h3 className="font-semibold truncate pr-8 text-sm md:text-base">{station.name}</h3>
    <div className="text-[10px] md:text-xs text-hw-muted mt-1 truncate">
      {station.nowPlaying ? (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-hw-accent animate-pulse" />
          <span className="text-hw-accent font-medium">Now Playing: {station.nowPlaying}</span>
        </div>
      ) : (
        <span>{station.country} • {station.tags?.slice(0, 2).join(', ') || 'Radio'}</span>
      )}
    </div>

    {currentStationId === station.id && isPlaying && (
      <div className="absolute bottom-4 right-4 flex items-end gap-0.5 h-6 pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div 
            key={i}
            animate={{ 
              height: [
                `${Math.random() * 40 + 20}%`, 
                `${Math.random() * 80 + 20}%`, 
                `${Math.random() * 30 + 20}%`, 
                `${Math.random() * 100}%`, 
                `${Math.random() * 40 + 20}%`
              ] 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.6 + Math.random() * 0.4, 
              ease: "easeInOut",
              delay: i * 0.1 
            }}
            className="w-1 bg-hw-accent rounded-full shadow-[0_0_10px_rgba(0,255,65,0.4)]"
          />
        ))}
      </div>
    )}
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('featured');
  const [stations, setStations] = useState<Station[]>(CURATED_STATIONS);
  const [trendingStations, setTrendingStations] = useState<Station[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.trim()) {
        searchStations(searchQuery);
      } else if (debouncedQuery && !searchQuery.trim()) {
        // Reset to default view when search is cleared
        if (userLocation.country) fetchLocalStations(userLocation.country);
        else setStations(CURATED_STATIONS);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ country?: string; countryCode?: string; city?: string }>({});
  const [favorites, setFavorites] = useState<Station[]>(() => {
    const saved = localStorage.getItem('waveiq_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('waveiq_profile');
    if (saved) return JSON.parse(saved);
    return {
      uuid: crypto.randomUUID(),
      tagPreferences: {},
      history: []
    };
  });

  const [player, setPlayer] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('waveiq_player_settings');
    const settings = saved ? JSON.parse(saved) : {};
    return {
      isPlaying: false,
      volume: settings.volume ?? 0.7,
      currentStation: CURATED_STATIONS[0],
      isMuted: settings.isMuted ?? false,
      quality: settings.quality ?? 'high'
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Metadata polling
  useEffect(() => {
    if (!player.isPlaying || !player.currentStation) return;

    const fetchMetadata = async () => {
      if (!player.currentStation?.url) return;
      setIsMetadataLoading(true);
      try {
        const response = await fetch(`/api/metadata?url=${encodeURIComponent(player.currentStation.url)}`);
        const data = await response.json();
        
        if (data && data.title) {
            const song = data.title;
            setCurrentSong(song); 
            setIsLive(true);
            // Update active station nowPlaying
            setPlayer(prev => ({
                ...prev,
                currentStation: prev.currentStation ? { ...prev.currentStation, nowPlaying: song } : null
            }));
            // Update stations state
            setStations(prev => prev.map(s => s.id === player.currentStation?.id ? { ...s, nowPlaying: song } : s));
        } else {
            // Fallback to Radio Browser API if ICY fails
            const rbResponse = await fetch(`/api/radio-browser/json/stations/byuuid?uuids=${player.currentStation?.id}`);
            const rbData = await rbResponse.json();
            if (rbData && rbData[0] && rbData[0].last_metadata_update) {
                const song = rbData[0].name;
                setCurrentSong(song);
                setIsLive(true);
                setPlayer(prev => ({
                    ...prev,
                    currentStation: prev.currentStation ? { ...prev.currentStation, nowPlaying: song } : null
                }));
                setStations(prev => prev.map(s => s.id === player.currentStation?.id ? { ...s, nowPlaying: song } : s));
            } else {
                setCurrentSong(null);
                setIsLive(false);
            }
        }
      } catch (e) {
        console.error("Metadata fetch failed", e);
        setCurrentSong(null);
        setIsLive(false);
      } finally {
        setIsMetadataLoading(false);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 30000);
    return () => clearInterval(interval);
  }, [player.isPlaying, player.currentStation?.id]);


  // --- Sleep Timer & EQ State ---
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [eqGains, setEqGains] = useState<number[]>(() => {
    const saved = localStorage.getItem('waveiq_eq_gains');
    return saved ? JSON.parse(saved) : [0, 0, 0, 0, 0];
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const isFadingOut = useRef(false);

  const initAudioContext = () => {
    if (audioCtxRef.current || !audioRef.current) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      
      const source = ctx.createMediaElementSource(audioRef.current);
      
      const frequencies = [60, 230, 910, 3600, 14000];
      const filters = frequencies.map(freq => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });
      
      filtersRef.current = filters;
      
      let lastNode: AudioNode = source;
      filters.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      lastNode.connect(ctx.destination);
      
      // Apply initial gains
      eqGains.forEach((gain, i) => {
        if (filtersRef.current[i]) {
          filtersRef.current[i].gain.value = gain;
        }
      });
    } catch (e) {
      console.error("Failed to initialize AudioContext", e);
    }
  };

  const handleEqChange = (index: number, value: number) => {
    const newGains = [...eqGains];
    newGains[index] = value;
    setEqGains(newGains);
    localStorage.setItem('waveiq_eq_gains', JSON.stringify(newGains));
    
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = value;
    }
  };

  const handleResetEq = () => {
    const newGains = [0, 0, 0, 0, 0];
    setEqGains(newGains);
    localStorage.setItem('waveiq_eq_gains', JSON.stringify(newGains));
    filtersRef.current.forEach(filter => {
      if (filter) filter.gain.value = 0;
    });
  };

  const handleSleepTimerChange = (minutes: number | null) => {
    setSleepTimer(minutes);
    setTimerSeconds(0);
    isFadingOut.current = false;
    // Reset volume if we were fading out
    if (audioRef.current) audioRef.current.volume = player.isMuted ? 0 : player.volume;
  };

  // Sleep Timer Countdown Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sleepTimer !== null && player.isPlaying) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(s => s - 1);
        } else if (sleepTimer > 0) {
          setSleepTimer(t => t - 1);
          setTimerSeconds(59);
        } else {
          // Time's up
          setSleepTimer(null);
          setPlayer(prev => ({ ...prev, isPlaying: false }));
          isFadingOut.current = false;
        }

        // Fade out in the last 30 seconds
        if (sleepTimer === 0 && timerSeconds <= 30 && timerSeconds > 0) {
          isFadingOut.current = true;
          const fadeRatio = timerSeconds / 30;
          if (audioRef.current) {
            audioRef.current.volume = (player.isMuted ? 0 : player.volume) * fadeRatio;
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sleepTimer, timerSeconds, player.isPlaying, player.volume, player.isMuted]);

  const handleSmartShuffle = async () => {
    setIsLoading(true);
    setPlaybackError(null);
    setActiveTab('smart_shuffle');
    try {
      const topTags = Object.entries(profile.tagPreferences as Record<string, number>)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([tag]) => tag);

      let path = `/json/stations/search?limit=50&order=clickcount&reverse=true&lastcheckok=1`;
      if (topTags.length > 0) {
        const randomTag = topTags[Math.floor(Math.random() * topTags.length)];
        path += `&tag=${encodeURIComponent(randomTag)}`;
      } else {
        path = `/json/stations/lastchange/50`;
      }

      const data = await fetchWithRetry(path);
      if (data && data.length > 0) {
        const mapped: Station[] = data.map((s: any) => ({
          id: s.stationuuid,
          name: s.name,
          url: s.url_resolved,
          favicon: s.favicon,
          tags: s.tags ? s.tags.split(',') : [],
          country: s.country,
          language: s.language,
          votes: s.votes,
          clickcount: s.clickcount,
          lastcheckok: s.lastcheckok === 1
        }));
        setStations(mapped);
        const randomStation = mapped[Math.floor(Math.random() * mapped.length)];
        selectStation(randomStation);
      }
    } catch (error) {
      console.error("Smart Shuffle failed", error);
      setPlaybackError("Smart Shuffle failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWithRetry = async (path: string, options: RequestInit = {}, retries = 3): Promise<any> => {
    let lastError: any;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < retries; i++) {
      try {
        // Ensure path starts with / for consistent proxy routing
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = `/api/radio-browser${normalizedPath}`;
        
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Accept': 'application/json, text/plain, */*',
          }
        });
        
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json') || 
                       contentType.includes('text/json') ||
                       contentType.includes('text/javascript');

        const text = await response.text();
        let data: any;
        let parseError = false;

        try {
          data = JSON.parse(text);
        } catch (e) {
          parseError = true;
        }

        if (!response.ok || (data && data.success === false)) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          if (data && data.error) {
            errorMessage = data.error || data.details || errorMessage;
          } else if (!parseError && data) {
            errorMessage = data.error || data.details || errorMessage;
          } else {
            // If it's HTML or something else, it's likely a proxy/server error
            errorMessage = `Server returned non-JSON response (${contentType})`;
            if (text.length > 0) {
              console.warn(`[Fetch] Non-JSON response body snippet: ${text.slice(0, 100)}`);
            }
          }
          throw new Error(errorMessage);
        }
        
        if (parseError) {
          throw new Error(`Expected JSON but received ${contentType || 'unknown'} (Parse failed)`);
        }

        return data;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Fetch] Attempt ${i + 1} failed for ${path}: ${error.message}`);
        
        if (i < retries - 1) {
          // Exponential backoff: 500ms, 1000ms, 2000ms...
          await sleep(Math.pow(2, i) * 500);
        }
      }
    }
    
    console.error(`Fetch failed for ${path} after ${retries} attempts:`, lastError.message);
    throw lastError;
  };

  const selectStation = (station: Station) => {
    setPlayer(prev => ({ ...prev, currentStation: station, isPlaying: true }));
  };

  const getActiveList = (): Station[] => {
    switch (activeTab) {
      case 'favorites': return favorites;
      case 'history': return profile.history;
      default: return stations;
    }
  };

  const onSkipNext = () => {
    const list = getActiveList();
    if (list.length === 0) return;
    const currentIndex = list.findIndex(s => s.id === player.currentStation?.id);
    const nextIndex = (currentIndex + 1) % list.length;
    selectStation(list[nextIndex]);
  };

  const onSkipPrevious = () => {
    const list = getActiveList();
    if (list.length === 0) return;
    const currentIndex = list.findIndex(s => s.id === player.currentStation?.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    selectStation(list[prevIndex]);
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenStartTime = useRef<number | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.crossOrigin = "anonymous"; // Required for Web Audio API
    
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handleError = (e: any) => {
      setIsLoading(false);
      const audio = audioRef.current;
      if (!audio) return;
      
      const error = audio.error;
      let message = "Failed to load stream.";
      
      if (error) {
        switch (error.code) {
          case 1: message = "Playback aborted."; break;
          case 2: message = "Network error. Check your connection."; break;
          case 3: message = "Decoding error. Format not supported."; break;
          case 4: message = "Source not found or mixed content blocked."; break;
        }
      }
      
      // Try alternative URL if available
      const currentStation = player.currentStation;
      if (currentStation && currentStation.url && currentStation.url_resolved) {
        const currentSrc = audio.src;
        const urlProxy = `/api/proxy-stream?url=${encodeURIComponent(currentStation.url)}`;
        const resolvedProxy = `/api/proxy-stream?url=${encodeURIComponent(currentStation.url_resolved)}`;
        
        // If we tried resolved and it failed, try original
        if (currentSrc.includes(encodeURIComponent(currentStation.url_resolved)) || currentSrc === currentStation.url_resolved) {
          console.log("[Playback] Resolved URL failed, trying original URL...");
          const nextUrl = currentStation.url.startsWith('http://') ? urlProxy : currentStation.url;
          if (audio.src !== nextUrl) {
            audio.src = nextUrl;
            audio.load();
            audio.play().catch(() => {});
            return;
          }
        } 
        // If we tried original and it failed, try resolved (if not tried yet)
        else if (currentSrc.includes(encodeURIComponent(currentStation.url)) || currentSrc === currentStation.url) {
          console.log("[Playback] Original URL failed, trying resolved URL...");
          const nextUrl = currentStation.url_resolved.startsWith('http://') ? resolvedProxy : currentStation.url_resolved;
          if (audio.src !== nextUrl) {
            audio.src = nextUrl;
            audio.load();
            audio.play().catch(() => {});
            return;
          }
        }
      }

      setPlaybackError(`${message} Trying next station...`);
      setPlayer(prev => ({ ...prev, isPlaying: false }));
      
      // Wait 2 seconds before skipping to let the user see the error
      setTimeout(() => {
        onSkipNext();
      }, 2000);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;

    // Fetch User Location
    const fetchLocation = async () => {
      try {
        // Try Geolocation first
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
              if (!res.ok) throw new Error("BigDataCloud fetch failed");
              const data = await res.json();
              if (data && data.countryCode) {
                setUserLocation({ country: data.countryName, countryCode: data.countryCode, city: data.city });
                fetchLocalStations(data.countryCode);
              }
            } catch (geoError) {
              console.warn("Reverse geocoding failed, falling back to IP", geoError);
              fallbackToIp();
            }
          }, async () => {
            fallbackToIp();
          });
        } else {
          fallbackToIp();
        }
      } catch (e) {
        console.error("Location detection failed", e);
      }
    };

    const fallbackToIp = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error("Location fetch failed");
        const data = await res.json();
        if (data && data.country_code) {
          setUserLocation({ country: data.country_name, countryCode: data.country_code, city: data.city });
          fetchLocalStations(data.country_code);
        }
      } catch (ipError) {
        console.error("IP location fallback failed", ipError);
        // Default to a popular country if everything fails
        fetchLocalStations('US');
      }
    };

    fetchLocation();

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const fetchLocalStations = async (countryCode: string) => {
    if (!countryCode) {
      console.warn("fetchLocalStations called without countryCode");
      return;
    }
    
    console.log(`Fetching local stations for: ${countryCode}`);
    try {
      const data = await fetchWithRetry(`/json/stations/bycountrycode/${countryCode}?limit=50&order=clickcount&reverse=true&lastcheckok=1`);
      if (data && data.length > 0) {
        const mapped: Station[] = data.map((s: any) => ({
          id: s.stationuuid,
          name: s.name,
          url: s.url,
          url_resolved: s.url_resolved,
          favicon: s.favicon,
          tags: s.tags ? s.tags.split(',') : [],
          country: s.country,
          language: s.language,
          votes: s.votes,
          clickcount: s.clickcount,
          lastcheckok: s.lastcheckok === 1,
          bitrate: s.bitrate
        }));
        
        // Auto-check first 15 stations
        const checked = await Promise.all(mapped.slice(0, 15).map(async (s) => {
          const isReachable = await checkStreamReachability(s.url_resolved || s.url);
          return isReachable ? s : null;
        }));
        
        setStations([...checked.filter(Boolean) as Station[], ...mapped.slice(15)]);
      }
    } catch (error) {
      console.error("Local stations fetch failed after retries", error);
    }
  };

  const fetchTop100Stations = async () => {
    setIsLoading(true);
    setPlaybackError(null);
    try {
      const data = await fetchWithRetry(`/json/stations/topclick/100`);
      const mapped: Station[] = data.map((s: any) => ({
        id: s.stationuuid,
        name: s.name,
        url: s.url,
        url_resolved: s.url_resolved,
        favicon: s.favicon,
        tags: s.tags ? s.tags.split(',') : [],
        country: s.country,
        language: s.language,
        votes: s.votes,
        clickcount: s.clickcount,
        lastcheckok: s.lastcheckok === 1,
        bitrate: s.bitrate
      }));
      
      // Auto-check first 20 stations for Top 100
      const checked = await Promise.all(mapped.slice(0, 20).map(async (s) => {
        const isReachable = await checkStreamReachability(s.url_resolved || s.url);
        return isReachable ? s : null;
      }));
      
      setStations([...checked.filter(Boolean) as Station[], ...mapped.slice(20)]);
      setActiveTab('top100');
    } catch (error) {
      console.error("Top 100 fetch failed after retries", error);
      setPlaybackError("Failed to fetch top stations. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredStations = async (countryCode: string, genre: string) => {
    setIsLoading(true);
    setPlaybackError(null);
    setFallbackMessage(null);
    
    try {
      // Use exact tag search if possible, or search with tag parameter
      // Radio Browser search API: tag parameter matches tags.
      let path = `/json/stations/search?limit=100&order=clickcount&reverse=true&lastcheckok=1`;
      if (countryCode) path += `&countrycode=${countryCode}`;
      if (genre) path += `&tag=${encodeURIComponent(genre.toLowerCase())}`;
      
      let data = await fetchWithRetry(path);
      
      // Client-side exact tag filtering to satisfy "Exact Tag Search" requirement
      let filteredData = data.filter((s: any) => {
        if (!genre) return true;
        const tags = s.tags ? s.tags.split(',').map((t: string) => t.trim().toLowerCase()) : [];
        return tags.includes(genre.toLowerCase());
      });

      // Fallback Logic: If no results for Country + Genre (after exact filtering), try Global Genre
      if (filteredData.length === 0 && genre) {
        if (countryCode) {
          const countryName = COUNTRIES.find(c => c.code === countryCode)?.name || countryCode;
          setFallbackMessage(`No exact matches for "${genre}" in ${countryName}. Showing global results.`);
        }
        
        const globalPath = `/json/stations/search?limit=100&order=clickcount&reverse=true&lastcheckok=1&tag=${encodeURIComponent(genre.toLowerCase())}`;
        const globalData = await fetchWithRetry(globalPath);
        
        filteredData = globalData.filter((s: any) => {
          const tags = s.tags ? s.tags.split(',').map((t: string) => t.trim().toLowerCase()) : [];
          return tags.includes(genre.toLowerCase());
        });
      }

      const mapped: Station[] = filteredData.map((s: any) => ({
        id: s.stationuuid,
        name: s.name,
        url: s.url,
        url_resolved: s.url_resolved,
        favicon: s.favicon,
        tags: s.tags ? s.tags.split(',').map((t: string) => t.trim()) : [],
        country: s.country,
        language: s.language,
        votes: s.votes,
        clickcount: s.clickcount,
        lastcheckok: s.lastcheckok === 1,
        bitrate: s.bitrate
      }));
      
      // Auto-check first 15 stations
      const checked = await Promise.all(mapped.slice(0, 15).map(async (s) => {
        const isReachable = await checkStreamReachability(s.url_resolved || s.url);
        return isReachable ? s : null;
      }));
      
      setStations([...checked.filter(Boolean) as Station[], ...mapped.slice(15)]);
      setActiveTab('featured');
    } catch (error) {
      console.error("Filter fetch failed after retries", error);
      setPlaybackError("Failed to fetch stations for the selected filters.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrendingStations = async () => {
    try {
      const data = await fetchWithRetry(`/json/stations/topvote/100`);
      const mapped: Station[] = data.map((s: any) => ({
        id: s.stationuuid,
        name: s.name,
        url: s.url,
        url_resolved: s.url_resolved,
        favicon: s.favicon,
        tags: s.tags ? s.tags.split(',') : [],
        country: s.country,
        language: s.language,
        votes: s.votes,
        clickcount: s.clickcount,
        lastcheckok: s.lastcheckok === 1,
        bitrate: s.bitrate
      }));
      setTrendingStations(mapped);
    } catch (error) {
      console.error("Trending fetch failed after retries", error);
    }
  };

  useEffect(() => {
    fetchTrendingStations();
  }, []);

  useEffect(() => {
    if (activeTab === 'smart_shuffle' || activeTab === 'discover' || activeTab === 'favorites' || activeTab === 'history') return;

    if (selectedCountry || selectedGenre) {
      fetchFilteredStations(selectedCountry, selectedGenre);
    } else {
      setFallbackMessage(null);
      if (userLocation.countryCode) {
        fetchLocalStations(userLocation.countryCode);
      } else {
        fetchTop100Stations();
      }
    }
  }, [selectedCountry, selectedGenre, userLocation.countryCode, activeTab]);

  // Synchronized Audio Controller
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !player.currentStation) return;

    const managePlayback = async () => {
      try {
        // 1. Handle Source Change
        if (audio.src !== player.currentStation?.url && audio.src !== player.currentStation?.url_resolved) {
          setPlaybackError(null);
          setIsLoading(true);
          
          if (playPromiseRef.current) {
            try { await playPromiseRef.current; } catch (e) { /* ignore interruption */ }
          }
          
          audio.pause();
          
          const url = player.currentStation?.url || '';
          const url_resolved = player.currentStation?.url_resolved;
          
          if (!url && !url_resolved) {
            setPlaybackError("No stream URL found. Trying next...");
            setTimeout(() => onSkipNext(), 2000);
            return;
          }

          // Check for unsupported playlist formats
          const lowerUrl = (url_resolved || url).toLowerCase();
          if (lowerUrl.endsWith('.pls') || lowerUrl.endsWith('.m3u') || lowerUrl.endsWith('.m3u8') || lowerUrl.endsWith('.asx')) {
            setPlaybackError("Playlist format (.pls/.m3u/.m3u8) not supported. Trying next...");
            setTimeout(() => onSkipNext(), 2000);
            return;
          }

          // Prefer HTTPS, fallback to proxy for HTTP
          // APK-Ready: In a native Android APK with cleartextTraffic enabled, 
          // we could use HTTP directly. In the browser, we must use the proxy.
          let streamToUse = url_resolved || url;
          
          // If resolved is HTTP but original is HTTPS, use original
          if (url_resolved?.startsWith('http://') && url?.startsWith('https://')) {
            streamToUse = url;
          } else if (url?.startsWith('http://') && url_resolved?.startsWith('https://')) {
            streamToUse = url_resolved;
          }
          
          const finalUrl = streamToUse.startsWith('http://') 
            ? `/api/proxy-stream?url=${encodeURIComponent(streamToUse)}` 
            : streamToUse;
            
          audio.src = finalUrl;
          audio.load();
        }

        // 2. Handle Play/Pause
        if (player.isPlaying) {
          if (audio.src) {
            initAudioContext();
            if (audioCtxRef.current?.state === 'suspended') {
              await audioCtxRef.current.resume();
            }
            playPromiseRef.current = audio.play();
            await playPromiseRef.current;
            listenStartTime.current = Date.now();
          }
        } else {
          if (playPromiseRef.current) {
            try { await playPromiseRef.current; } catch (e) { /* ignore */ }
          }
          audio.pause();
          
          if (listenStartTime.current && player.currentStation) {
            const duration = Math.floor((Date.now() - listenStartTime.current) / 1000);
            if (duration > 5) updateHistory(player.currentStation, duration);
          }
          listenStartTime.current = null;
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Playback error:", error);
          setPlaybackError("Playback failed. Please try another station.");
          setPlayer(prev => ({ ...prev, isPlaying: false }));
        }
      }
    };

    managePlayback();
  }, [player.currentStation, player.isPlaying]);

  // Handle Volume
  useEffect(() => {
    if (audioRef.current && !isFadingOut.current) {
      audioRef.current.volume = player.isMuted ? 0 : player.volume;
    }
  }, [player.volume, player.isMuted]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('waveiq_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('waveiq_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('waveiq_player_settings', JSON.stringify({
      volume: player.volume,
      isMuted: player.isMuted,
      quality: player.quality
    }));
  }, [player.volume, player.isMuted, player.quality]);

  const updateHistory = (station: Station, duration: number) => {
    setProfile(prev => {
      const newHistory = [{ station, timestamp: Date.now(), duration }, ...prev.history].slice(0, 50);
      const newTags = { ...prev.tagPreferences };
      
      station.tags?.forEach(tag => {
        const cleanTag = tag.trim().toLowerCase();
        newTags[cleanTag] = (newTags[cleanTag] || 0) + (duration / 60);
      });

      return { ...prev, history: newHistory, tagPreferences: newTags };
    });
  };

  const togglePlay = () => setPlayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  
  const toggleFavorite = (station: Station) => {
    setFavorites(prev => 
      prev.some(f => f.id === station.id) 
        ? prev.filter(f => f.id !== station.id) 
        : [...prev, station]
    );
  };

  const searchStations = async (query: string) => {
    if (!query && !selectedCountry && !selectedGenre) {
      if (userLocation.country) fetchLocalStations(userLocation.country);
      else setStations(CURATED_STATIONS);
      return;
    }
    setIsLoading(true);
    setPlaybackError(null);
    try {
      let path = `json/stations/search?limit=100&order=votes&reverse=true`;
      if (query) path += `&name=${encodeURIComponent(query)}`;
      if (selectedCountry) path += `&country=${encodeURIComponent(selectedCountry)}`;
      if (selectedGenre) path += `&tag=${encodeURIComponent(selectedGenre)}`;
      
      const data = await fetchWithRetry(path);
      const mapped: Station[] = data.map((s: any) => ({
        id: s.stationuuid,
        name: s.name,
        url: s.url,
        url_resolved: s.url_resolved,
        favicon: s.favicon,
        tags: s.tags ? s.tags.split(',') : [],
        country: s.country,
        language: s.language,
        votes: s.votes,
        clickcount: s.clickcount,
        lastcheckok: s.lastcheckok === 1,
        bitrate: s.bitrate
      }));
      setStations(mapped);
      setActiveTab('featured');
    } catch (error) {
      console.error("Search failed", error);
      setPlaybackError("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const recommendations = useMemo(() => {
    const topTags = Object.entries(profile.tagPreferences as Record<string, number>)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([tag]) => tag);

    if (topTags.length === 0) return [];

    return CURATED_STATIONS.filter(s => 
      s.tags?.some(t => topTags.includes(t.toLowerCase())) &&
      s.id !== player.currentStation?.id
    );
  }, [profile.tagPreferences, player.currentStation]);

  useEffect(() => {
    if (debouncedQuery) {
      const list = activeTab === 'favorites' ? favorites : 
                   activeTab === 'discover' ? recommendations :
                   activeTab === 'trending' ? trendingStations : stations;
      
      const filtered = list.filter(s => 
        s.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        s.tags?.some(t => t.toLowerCase().includes(debouncedQuery.toLowerCase())) ||
        s.country.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      
      if (filtered.length === 0) {
        searchStations(debouncedQuery);
      }
    }
  }, [debouncedQuery, activeTab, stations, favorites, recommendations, trendingStations]);

  const displayStations = useMemo(() => {
    let list: Station[] = [];
    if (activeTab === 'favorites') list = favorites;
    else if (activeTab === 'discover') list = recommendations;
    else if (activeTab === 'trending') list = trendingStations;
    else list = stations;

    if (debouncedQuery) {
      return list.filter(s => 
        s.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        s.tags?.some(t => t.toLowerCase().includes(debouncedQuery.toLowerCase())) ||
        s.country.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }
    
    return list;
  }, [activeTab, stations, favorites, recommendations, trendingStations, debouncedQuery]);

  return (
    <div className="fixed inset-0 flex flex-col bg-hw-bg text-hw-text font-sans overflow-hidden select-none">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        quality={player.quality}
        onQualityChange={(q) => setPlayer(prev => ({ ...prev, quality: q }))}
        userLocation={userLocation}
        uuid={profile.uuid}
        eqGains={eqGains}
        onEqChange={handleEqChange}
        onResetEq={handleResetEq}
        sleepTimer={sleepTimer}
        onSleepTimerChange={handleSleepTimerChange}
      />

      {/* Mobile Header - Fixed at top */}
      <div className="md:hidden h-16 flex items-center justify-between px-6 bg-hw-panel border-b border-white/5 z-50 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="text-hw-accent" size={20} />
          <h1 className="text-lg font-bold tracking-tighter font-mono">WAVEIQ</h1>
        </div>
        
        {sleepTimer !== null && (
          <div className="flex items-center gap-2 px-3 py-1 bg-hw-accent/10 border border-hw-accent/20 rounded-full">
            <Timer size={12} className="text-hw-accent animate-pulse" />
            <span className="text-[9px] font-mono text-hw-accent">{sleepTimer}m {timerSeconds}s</span>
          </div>
        )}

        <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-hw-panel rounded-full hw-border">
          <Settings size={18} className="text-hw-muted" />
        </button>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Sidebar - Navigation (Desktop) */}
        <aside className="hidden md:flex w-64 bg-hw-panel hw-border flex-col p-6 gap-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-hw-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,255,65,0.4)]">
            <Zap className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter hw-text-glow font-mono">WAVEIQ</h1>
            {sleepTimer !== null && (
              <div className="flex items-center gap-1 text-[9px] text-hw-accent font-mono uppercase tracking-widest mt-0.5">
                <Timer size={10} className="animate-pulse" />
                <span>{sleepTimer}m {timerSeconds}s</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={handleSmartShuffle}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium group ${activeTab === 'smart_shuffle' ? 'bg-hw-accent/10 text-hw-accent' : 'hover:bg-white/5'}`}
          >
            <Zap size={18} className={activeTab === 'smart_shuffle' ? 'text-hw-accent' : 'text-hw-muted group-hover:text-hw-accent'} />
            Smart Shuffle
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium group ${activeTab === 'discover' ? 'bg-hw-accent/10 text-hw-accent' : 'hover:bg-white/5'}`}
          >
            <Sparkles size={18} className={activeTab === 'discover' ? 'text-hw-accent' : 'text-hw-muted group-hover:text-hw-accent'} />
            Discovery Hub
          </button>
          <button 
            onClick={() => setActiveTab('featured')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium group ${activeTab === 'featured' ? 'bg-hw-accent/10 text-hw-accent' : 'hover:bg-white/5'}`}
          >
            <MapPin size={18} className={activeTab === 'featured' ? 'text-hw-accent' : 'text-hw-muted group-hover:text-hw-accent'} />
            Local Stations
          </button>
          <button 
            onClick={fetchTop100Stations}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium group ${activeTab === 'top100' ? 'bg-hw-accent/10 text-hw-accent' : 'hover:bg-white/5'}`}
          >
            <BarChart3 size={18} className={activeTab === 'top100' ? 'text-hw-accent' : 'text-hw-muted group-hover:text-hw-accent'} />
            Top 100
          </button>
          <button 
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium group ${activeTab === 'trending' ? 'bg-hw-accent/10 text-hw-accent' : 'hover:bg-white/5'}`}
          >
            <Globe size={18} className={activeTab === 'trending' ? 'text-hw-accent' : 'text-hw-muted group-hover:text-hw-accent'} />
            Trending
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium group ${activeTab === 'favorites' ? 'bg-hw-accent/10 text-hw-accent' : 'hover:bg-white/5'}`}
          >
            <Heart size={18} className={activeTab === 'favorites' ? 'text-hw-accent' : 'text-hw-muted group-hover:text-hw-accent'} />
            Favorites
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium group ${activeTab === 'history' ? 'bg-hw-accent/10 text-hw-accent' : 'hover:bg-white/5'}`}
          >
            <HistoryIcon size={18} className={activeTab === 'history' ? 'text-hw-accent' : 'text-hw-muted group-hover:text-hw-accent'} />
            History
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <p className="text-[9px] text-hw-muted leading-tight text-center">Privacy-first: All data stays on your device.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-10 gap-8 overflow-y-auto relative">
        {/* Header / Search */}
        <header className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">
                {activeTab === 'featured' ? 'Local Stations' : activeTab === 'top100' ? 'Top 100 Global' : activeTab === 'smart_shuffle' ? 'Smart Shuffle' : activeTab === 'discover' ? 'Discovery Hub' : activeTab}
              </h2>
              <p className="text-hw-muted text-xs md:text-sm mt-1">
                {activeTab === 'featured' 
                  ? `Local stations from ${COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry || userLocation.country || 'Global'}.` 
                  : activeTab === 'top100' ? 'The most listened stations globally.' : activeTab === 'trending' ? 'Most popular stations worldwide.' : activeTab === 'discover' ? 'Personalized recommendations based on your taste.' : activeTab === 'smart_shuffle' ? 'AI-powered Auto-DJ picking the perfect stream for you.' : 'Explore global radio stations.'}
              </p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-hw-muted" size={18} />
              <input 
                type="text"
                placeholder="Search stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchStations(searchQuery)}
                className="w-full bg-hw-panel hw-border rounded-full py-2.5 md:py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-hw-accent/50 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-hw-muted hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4">
            {fallbackMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-hw-accent/10 border border-hw-accent/20 rounded-lg p-3 flex items-center gap-3"
              >
                <Sparkles size={16} className="text-hw-accent shrink-0" />
                <p className="text-xs text-hw-accent font-medium">{fallbackMessage}</p>
                <button 
                  onClick={() => setFallbackMessage(null)}
                  className="ml-auto p-1 hover:bg-hw-accent/20 rounded-full transition-colors"
                >
                  <X size={14} className="text-hw-accent" />
                </button>
              </motion.div>
            )}
            
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 bg-hw-panel hw-border rounded-full px-3 md:px-4 py-1.5 md:py-2">
                <Globe size={14} className="text-hw-muted" />
                <select 
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                  }}
                  className="bg-transparent text-[10px] md:text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-hw-panel">All Countries</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-hw-panel">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-hw-panel hw-border rounded-full px-3 md:px-4 py-1.5 md:py-2">
                <ListMusic size={14} className="text-hw-muted" />
                <select 
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value);
                  }}
                  className="bg-transparent text-[10px] md:text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-hw-panel">All Genres</option>
                  {GENRES.map(g => (
                    <option key={g} value={g} className="bg-hw-panel">{g}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleSmartShuffle}
                className={`flex items-center gap-2 border rounded-full px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-bold transition-all ${
                  activeTab === 'smart_shuffle' 
                    ? 'bg-hw-accent border-hw-accent text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' 
                    : 'bg-hw-panel border-white/10 text-hw-muted hover:border-hw-accent/50 hover:text-hw-accent'
                }`}
              >
                <Zap size={14} />
                SMART SHUFFLE
              </button>

              {(selectedCountry || selectedGenre) && (
                <button 
                  onClick={() => {
                    setSelectedCountry('');
                    setSelectedGenre('');
                  }}
                  className="text-[10px] md:text-xs text-hw-muted hover:text-white transition-colors flex items-center gap-1"
                >
                  <X size={12} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="pb-48 md:pb-0"> {/* Space for mobile floating nav and player bar */}
          {activeTab === 'discover' ? (
            <div className="flex flex-col gap-10">
              {/* AI Recommendations Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles size={20} className="text-hw-accent" />
                    Personalized Recommendations
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recommendations.map(station => (
                    <StationCard 
                      key={station.id} 
                      station={station} 
                      currentStationId={player.currentStation?.id}
                      isPlaying={player.isPlaying}
                      onSelect={selectStation}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={favorites.some(f => f.id === station.id)}
                    />
                  ))}
                  {recommendations.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-hw-panel/50 hw-border rounded-3xl">
                      <Sparkles size={48} className="mx-auto text-hw-muted mb-4 opacity-20" />
                      <p className="text-hw-muted text-sm">Listen to more music to unlock AI-powered recommendations.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Genre Hub */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <ListMusic size={20} className="text-hw-accent" />
                    Explore New Genres
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {GENRES.slice(0, 12).map(genre => (
                    <button 
                      key={genre}
                      onClick={() => {
                        setSelectedGenre(genre);
                        setActiveTab('featured');
                        fetchFilteredStations(selectedCountry, genre);
                      }}
                      className="p-5 bg-hw-panel hw-border rounded-2xl hover:bg-hw-accent/10 hover:border-hw-accent/30 transition-all text-center group"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-hw-accent">{genre}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Global Trends */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Globe size={20} className="text-hw-accent" />
                    Global Trends
                  </h3>
                  <button onClick={() => setActiveTab('trending')} className="text-xs text-hw-accent font-bold uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trendingStations.slice(0, 4).map(station => (
                    <StationCard 
                      key={station.id} 
                      station={station} 
                      currentStationId={player.currentStation?.id}
                      isPlaying={player.isPlaying}
                      onSelect={selectStation}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={favorites.some(f => f.id === station.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : activeTab === 'favorites' ? (
            <div className="flex flex-col gap-4">
              {favorites.length === 0 ? (
                <div className="text-center py-20 bg-hw-panel hw-border rounded-3xl">
                  <Heart size={48} className="mx-auto text-hw-muted mb-4 opacity-20" />
                  <p className="text-hw-muted">Du hast noch keine Favoriten hinzugefügt.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {favorites.map((station) => (
                      <StationCard 
                        key={station.id} 
                        station={station} 
                        currentStationId={player.currentStation?.id}
                        isPlaying={player.isPlaying}
                        onSelect={selectStation}
                        onToggleFavorite={toggleFavorite}
                        isFavorite={true}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : activeTab === 'history' ? (
            <div className="flex flex-col gap-4">
              {profile.history.length === 0 ? (
                <div className="text-center py-20 bg-hw-panel hw-border rounded-3xl">
                  <HistoryIcon size={48} className="mx-auto text-hw-muted mb-4 opacity-20" />
                  <p className="text-hw-muted">No listening history yet.</p>
                </div>
              ) : (
                profile.history.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-hw-panel hw-border rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => selectStation(item.station)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden">
                        {item.station.favicon ? <img src={item.station.favicon} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Radio className="text-hw-muted" size={20} />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{item.station.name}</h4>
                        <p className="text-[10px] text-hw-muted">{new Date(item.timestamp).toLocaleString()} • {Math.floor(item.duration / 60)}m {item.duration % 60}s</p>
                      </div>
                    </div>
                    <Play size={16} className="text-hw-accent opacity-0 group-hover:opacity-100" />
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'insights' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-hw-panel hw-border rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-hw-accent" />
                  Top Genres
                </h3>
                <div className="space-y-4">
                  {Object.entries(profile.tagPreferences as Record<string, number>)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([tag, weight]) => (
                      <div key={tag}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize">{tag}</span>
                          <span className="text-hw-muted">{Math.round(weight as number)} min</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((weight as number) / 60) * 100)}%` }}
                            className="h-full bg-hw-accent"
                          />
                        </div>
                      </div>
                    ))}
                  {Object.keys(profile.tagPreferences).length === 0 && <p className="text-sm text-hw-muted">Listen to more music to see insights.</p>}
                </div>
              </div>
              <div className="bg-hw-panel hw-border rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <ShieldCheck size={48} className="text-hw-accent mb-4" />
                <h3 className="text-lg font-bold mb-2">Privacy Protected</h3>
                <p className="text-sm text-hw-muted">All your listening data is stored locally on this device. No personal data is sent to our servers.</p>
              </div>
            </div>
          ) : displayStations.length === 0 && debouncedQuery ? (
            <div className="text-center py-20 bg-hw-panel hw-border rounded-3xl">
              <p className="text-hw-muted">Kein Sender für '{debouncedQuery}' gefunden.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {displayStations.map((station) => (
                  <StationCard 
                    key={station.id} 
                    station={station} 
                    currentStationId={player.currentStation?.id}
                    isPlaying={player.isPlaying}
                    onSelect={selectStation}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={favorites.some(f => f.id === station.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Floating Mobile Navigation */}
        <div className="md:hidden fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
          <div className="bg-hw-panel/80 backdrop-blur-xl hw-border rounded-full p-2 flex items-center justify-around shadow-2xl">
            <button 
              onClick={handleSmartShuffle}
              className={`p-3 rounded-full transition-all ${activeTab === 'smart_shuffle' ? 'bg-hw-accent text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'text-hw-muted'}`}
            >
              <Zap size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('discover')}
              className={`p-3 rounded-full transition-all ${activeTab === 'discover' ? 'bg-hw-accent text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'text-hw-muted'}`}
            >
              <Sparkles size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('trending')}
              className={`p-3 rounded-full transition-all ${activeTab === 'trending' ? 'bg-hw-accent text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'text-hw-muted'}`}
            >
              <Globe size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`p-3 rounded-full transition-all ${activeTab === 'favorites' ? 'bg-hw-accent text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'text-hw-muted'}`}
            >
              <Heart size={20} />
            </button>
            <button 
              onClick={() => document.querySelector('input')?.focus()}
              className="p-3 rounded-full transition-all text-hw-muted"
            >
              <Search size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>

      {/* Player Bar */}
      <footer className="h-32 md:h-36 bg-hw-panel border-t border-white/10 py-6 px-6 md:py-8 md:px-10 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-4 z-50 shrink-0">
        <div className="flex items-center gap-4 w-1/4 md:w-1/3 min-w-0">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-black/40 flex-shrink-0 flex items-center justify-center overflow-hidden hw-border">
              {player.currentStation?.favicon ? (
                <img src={player.currentStation.favicon} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Radio className="text-hw-muted" size={24} />
              )}
            </div>
            <span className="text-[8px] md:text-[9px] bg-hw-accent/10 px-2 py-0.5 rounded-full text-hw-accent uppercase font-bold tracking-widest border border-hw-accent/20">
              {player.quality}
            </span>
          </div>
          <div className="hidden md:block min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-xs font-mono truncate uppercase tracking-wider ${playbackError ? 'text-red-500' : 'text-hw-accent'}`}>
                {playbackError ? 'Error' : player.isPlaying ? (isLoading ? 'Buffering...' : 'WaveIQ Streaming') : 'Ready'}
              </p>
              {isLoading && player.isPlaying && !playbackError && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-2 h-2 border-t-2 border-hw-accent rounded-full"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full relative">
          <div className="absolute -top-6 left-0 right-0 flex justify-center">
            {playbackError && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 whitespace-nowrap"
              >
                {playbackError}
              </motion.p>
            )}
          </div>
          <div className="text-center w-full max-w-xs md:max-w-md">
            <p className="text-[10px] md:text-xs text-hw-muted truncate tracking-widest uppercase">
              {player.currentStation?.name || 'Select a station'}
            </p>
            <h4 className="font-bold truncate text-base md:text-xl text-white tracking-tight mt-1 animate-pulse-green">
              {isMetadataLoading ? 'Lade Songinfo...' : (currentSong || (player.currentStation ? `${player.currentStation.tags?.slice(0, 2).join(', ') || 'Radio'}` : 'Ready'))}
              {player.currentStation?.bitrate && <span className="hidden md:inline text-sm text-hw-muted ml-2">({player.currentStation.bitrate}kbps)</span>}
            </h4>
            {isLive && !isMetadataLoading && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] text-red-500 uppercase tracking-widest">Live</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={onSkipPrevious}
              className="text-white hover:text-hw-accent transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlay}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-hw-accent text-black flex items-center justify-center hover:scale-105 transition-transform hw-glow ${player.isPlaying && !isLoading ? 'animate-pulse' : ''}`}
            >
              {player.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button 
              onClick={onSkipNext}
              className="text-white hover:text-hw-accent transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>
          <div className="hidden md:block w-full max-w-md">
            <Visualizer isPlaying={player.isPlaying} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-6 w-1/4 md:w-1/3">
          <div className="hidden md:flex items-center gap-3 w-32">
            <button 
              onClick={() => setPlayer(prev => ({ ...prev, isMuted: !prev.isMuted }))}
              className="text-hw-muted hover:text-white transition-colors"
            >
              {player.isMuted || player.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={player.volume}
              onChange={(e) => setPlayer(prev => ({ ...prev, volume: parseFloat(e.target.value), isMuted: false }))}
              className="w-full accent-hw-accent h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="text-hw-muted hover:text-white transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
