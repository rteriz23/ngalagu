import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useAuthStore } from '../../store/authStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Bluetooth, Heart, Sliders, Zap } from 'lucide-react';
import { audioManager } from '../../lib/audioManager';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const GlobalPlayer: React.FC = () => {
  const { currentTrack, isPlaying, setIsPlaying, playNext, playPrev, setProgress, progress, currentTime, duration } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  
  // UI states
  const [showLyrics, setShowLyrics] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [fetchedLyrics, setFetchedLyrics] = useState<string | null>(null);
  
  // Likes & History states
  const [isLiked, setIsLiked] = useState(false);
  const { token: authToken } = useAuthStore();

  // DJ Mixer states
  const [showDjMixer, setShowDjMixer] = useState(false);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [echoEnabled, setEchoEnabled] = useState(false);
  const [distortionEnabled, setDistortionEnabled] = useState(false);
  const [jedagEnabled, setJedagEnabled] = useState(false);

  // Beat intensity for Jedag-Jedug strobe animations
  const [bassIntensity, setBassIntensity] = useState(0);

  // Check if track is liked
  useEffect(() => {
    if (!currentTrack || !authToken) return;
    setIsLiked(false);
    
    const checkLiked = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tracks/liked`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.data.success && Array.isArray(res.data.data)) {
          const found = res.data.data.some((t: any) => t.track_id == currentTrack.id);
          setIsLiked(found);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkLiked();
  }, [currentTrack?.id, authToken]);

  // Log track listening history when it starts playing
  useEffect(() => {
    if (!currentTrack || !authToken) return;
    
    const logHistory = async () => {
      try {
        await axios.post(
          `${API_BASE}/history`,
          {
            track_id: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist,
            cover: currentTrack.cover || '',
            preview_url: currentTrack.preview_url || '',
            youtube_id: currentTrack.youtube_id || '',
            duration: currentTrack.duration || 0
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } catch (e) {
        console.error('Failed to log history:', e);
      }
    };
    logHistory();
  }, [currentTrack?.id, authToken]);

  // Handle Like track action
  const handleLikeClick = async () => {
    if (!currentTrack || !authToken) return;
    try {
      const res = await axios.post(
        `${API_BASE}/tracks/like`,
        {
          track_id: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          cover: currentTrack.cover || '',
          preview_url: currentTrack.preview_url || '',
          youtube_id: currentTrack.youtube_id || '',
          duration: currentTrack.duration || 0
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) {
        setIsLiked(res.data.liked);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Connect Audio Manager and apply effects on track load
  const setupAudioEngine = (audio: HTMLAudioElement) => {
    audioManager.init(audio);
    // Sync current sliders
    audioManager.setEq(eqLow, eqMid, eqHigh);
    audioManager.setEcho(echoEnabled);
    audioManager.setDistortion(distortionEnabled);
    audioManager.setJedagJedug(jedagEnabled);
    audio.playbackRate = playbackSpeed;
  };

  // Create/update audio element when track changes
  useEffect(() => {
    if (!currentTrack) return;

    accumulatedTimeRef.current = 0;

    // Reset and fetch real lyrics
    setFetchedLyrics('Mencari lirik...');
    const fetchLyrics = async () => {
      try {
        const query = new URLSearchParams({
          artist_name: currentTrack.artist,
          track_name: currentTrack.title
        });
        const res = await fetch(`https://lrclib.net/api/get?${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.syncedLyrics) {
            setFetchedLyrics(data.syncedLyrics);
          } else if (data.plainLyrics) {
            setFetchedLyrics(data.plainLyrics);
          } else {
            setFetchedLyrics('Maaf, lirik tidak ditemukan untuk lagu ini.');
          }
        } else {
          setFetchedLyrics('Maaf, lirik tidak ditemukan untuk lagu ini.');
        }
      } catch (e) {
        setFetchedLyrics('Gagal memuat lirik.');
      }
    };
    fetchLyrics();

    // Use full track audio_url if present (uploaded), otherwise preview_url
    const audioSrc = (currentTrack as any).audio_url 
      ? `http://localhost:8000${(currentTrack as any).audio_url}` 
      : currentTrack.preview_url || '';
    
    if (!audioSrc) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      setupAudioEngine(audioRef.current);
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
        const ctx = audioManager.getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } else {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = audioSrc;
      audio.volume = volume;
      audioRef.current = audio;
      
      setupAudioEngine(audio);

      audio.addEventListener('ended', () => {
        const targetDuration = currentTrack.duration || 180;
        const nextAccumulated = accumulatedTimeRef.current + audio.duration;
        if (audio.duration > 0 && audio.duration < targetDuration && nextAccumulated < targetDuration) {
          accumulatedTimeRef.current = nextAccumulated;
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          accumulatedTimeRef.current = 0;
          playNext();
        }
      });

      audio.addEventListener('timeupdate', () => {
        const targetDuration = currentTrack.duration || 180;
        const virtualCurrentTime = accumulatedTimeRef.current + audio.currentTime;
        const displayCurrentTime = Math.min(virtualCurrentTime, targetDuration);
        
        const isPreview = audio.duration > 0 && audio.duration < targetDuration;
        const usedDuration = isPreview ? targetDuration : (audio.duration || targetDuration);

        const prog = (displayCurrentTime / usedDuration) * 100;
        setProgress(prog, displayCurrentTime, usedDuration);

        if (isPreview && virtualCurrentTime >= targetDuration) {
          accumulatedTimeRef.current = 0;
          audio.pause();
          playNext();
        }
      });

      if (isPlaying) {
        audio.play().catch(() => {});
        const ctx = audioManager.getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // RequestAnimationFrame loop for real-time Jedag-Jedug visualization
  useEffect(() => {
    let animationFrameId: number;

    const updateBeatFrequency = () => {
      if (isPlaying) {
        const intensity = audioManager.getBassIntensity();
        setBassIntensity(intensity);
      } else {
        setBassIntensity(0);
      }
      animationFrameId = requestAnimationFrame(updateBeatFrequency);
    };

    updateBeatFrequency();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  // Play/pause sync
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
      const ctx = audioManager.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync EQ values
  useEffect(() => {
    audioManager.setEq(eqLow, eqMid, eqHigh);
  }, [eqLow, eqMid, eqHigh]);

  // Sync Echo
  useEffect(() => {
    audioManager.setEcho(echoEnabled);
  }, [echoEnabled]);

  // Sync Distortion
  useEffect(() => {
    audioManager.setDistortion(distortionEnabled);
  }, [distortionEnabled]);

  // Sync Jedag-Jedug
  useEffect(() => {
    audioManager.setJedagJedug(jedagEnabled);
    if (jedagEnabled) {
      setEqLow(15); // Bass boost automatically
    } else {
      setEqLow(0);
    }
  }, [jedagEnabled]);

  // Sync Playback speed (Tune)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    const targetDuration = currentTrack?.duration || 180;
    const targetTime = percentage * targetDuration;
    const audioDuration = audioRef.current.duration;

    if (audioDuration > 0 && audioDuration < targetDuration) {
      const loopCount = Math.floor(targetTime / audioDuration);
      accumulatedTimeRef.current = loopCount * audioDuration;
      audioRef.current.currentTime = targetTime % audioDuration;
    } else {
      accumulatedTimeRef.current = 0;
      audioRef.current.currentTime = targetTime;
    }
  }, [currentTrack?.duration]);

  const handleBluetoothConnect = async () => {
    try {
      if (!isBluetoothConnected) {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service']
        });
        setIsBluetoothConnected(true);
        device.addEventListener('gattserverdisconnected', () => {
          setIsBluetoothConnected(false);
        });
      } else {
        setIsBluetoothConnected(false);
      }
    } catch (error: any) {
      alert('Browser Anda tidak mendukung Web Bluetooth API secara native.');
    }
  };

  if (!currentTrack) return null;

  // Strobe visualizer properties mapped to bass levels
  const glowShadow = jedagEnabled 
    ? `0 0 ${20 + (bassIntensity / 5)}px rgba(168, 85, 247, ${0.3 + (bassIntensity / 255)})` 
    : '0 -10px 40px rgba(0,0,0,0.5)';
  const coverScale = jedagEnabled ? 1 + (bassIntensity / 1200) : 1;
  const vibrationTranslate = jedagEnabled && bassIntensity > 150 
    ? `translate(${(Math.random() - 0.5) * (bassIntensity / 50)}px, ${(Math.random() - 0.5) * (bassIntensity / 50)}px)` 
    : 'translate(0px, 0px)';

  return (
    <>
      {/* Lyrics Overlay (If toggled) */}
      {showLyrics && (
        <div className="fixed inset-x-0 bottom-24 top-0 bg-slate-950/95 backdrop-blur-2xl z-40 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          <h2 className="text-2xl font-bold text-white mb-2">{currentTrack.title}</h2>
          <p className="text-cyan-400 mb-8">{currentTrack.artist}</p>
          <div className="w-full max-w-2xl h-[60vh] overflow-y-auto scrollbar-hide text-center">
            <p className="text-xl md:text-3xl text-slate-300 font-bold leading-loose whitespace-pre-line tracking-tight mx-auto animate-pulse">
              {fetchedLyrics || currentTrack.lyrics || "Instrumen sedang dimainkan..."}
            </p>
          </div>
        </div>
      )}

      {/* DJ Remix Mixer Panel Overlay */}
      {showDjMixer && (
        <div className="fixed bottom-28 right-8 w-80 bg-slate-950/90 border border-slate-800/80 backdrop-blur-2xl rounded-2xl p-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-250">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-sm">DJ Remix Equalizer</h3>
            </div>
            <button 
              onClick={() => setShowDjMixer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="space-y-5">
            {/* Jedag-Jedug Button */}
            <button
              onClick={() => setJedagEnabled(!jedagEnabled)}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all duration-300 ${
                jedagEnabled 
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white animate-pulse drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className={`w-4 h-4 ${jedagEnabled ? 'animate-bounce' : ''}`} />
              {jedagEnabled ? 'JEDAG-JEDUG MIXER: ON' : 'AKTIFKAN JEDAG-JEDUG'}
            </button>

            {/* EQ Sliders */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400">Custom EQ Bands</h4>
              
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Bass (Low)</span>
                  <span className="font-mono">{eqLow} dB</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="18"
                  value={eqLow}
                  onChange={(e) => setEqLow(parseInt(e.target.value))}
                  className="w-full h-1 accent-purple-500 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Vocal (Mid)</span>
                  <span className="font-mono">{eqMid} dB</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  value={eqMid}
                  onChange={(e) => setEqMid(parseInt(e.target.value))}
                  className="w-full h-1 accent-purple-500 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Treble (High)</span>
                  <span className="font-mono">{eqHigh} dB</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  value={eqHigh}
                  onChange={(e) => setEqHigh(parseInt(e.target.value))}
                  className="w-full h-1 accent-purple-500 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Pitch Speed Tune */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                <span>Speed Pitch (Tune)</span>
                <span className="font-mono text-purple-400">{playbackSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="w-full h-1 accent-purple-500 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Effects Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-900">
              <h4 className="text-xs font-semibold text-slate-400">DJ Sound Effects</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Echo / Delay</span>
                <button
                  onClick={() => setEchoEnabled(!echoEnabled)}
                  className={`w-10 h-5 rounded-full p-1 transition-all ${echoEnabled ? 'bg-purple-600 flex justify-end' : 'bg-slate-800 flex justify-start'}`}
                >
                  <span className="w-3 h-3 bg-white rounded-full" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">DJ Distortion</span>
                <button
                  onClick={() => setDistortionEnabled(!distortionEnabled)}
                  className={`w-10 h-5 rounded-full p-1 transition-all ${distortionEnabled ? 'bg-purple-600 flex justify-end' : 'bg-slate-800 flex justify-start'}`}
                >
                  <span className="w-3 h-3 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Player Bar */}
      <div 
        className="fixed bottom-0 w-full h-24 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-between px-4 lg:px-8 z-50 transition-all duration-75"
        style={{ 
          boxShadow: glowShadow, 
          transform: vibrationTranslate 
        }}
      >
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
          <img 
            src={currentTrack.cover} 
            alt={currentTrack.title} 
            className="w-14 h-14 rounded-md shadow-md object-cover transition-transform"
            style={{ transform: `scale(${coverScale})` }}
          />
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-semibold text-sm truncate">{currentTrack.title}</h4>
              {(currentTrack as any).is_uploaded && (
                <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1 rounded">Milikku</span>
              )}
            </div>
            <p className="text-slate-400 text-xs truncate hover:underline cursor-pointer">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center flex-1 max-w-2xl">
          <div className="flex items-center gap-6 mb-2">
            <button onClick={playPrev} className="text-slate-400 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className={`w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg ${
                jedagEnabled 
                  ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-purple-500/20' 
                  : 'bg-white text-black shadow-white/10'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button onClick={playNext} className="text-slate-400 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{formatTime(currentTime)}</span>
            <div 
              className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden group cursor-pointer hover:h-2 transition-all"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="flex items-center justify-end gap-4 w-1/3 min-w-[200px]">
          {/* Heart Button for liking tracks */}
          <button
            onClick={handleLikeClick}
            className={`p-2 rounded-full transition-all ${isLiked ? 'text-red-500 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-slate-400 hover:text-white'}`}
            title="Like Track"
          >
            <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
          </button>

          {/* DJ Mixer Button */}
          <button
            onClick={() => setShowDjMixer(!showDjMixer)}
            className={`p-2 rounded-full transition-all ${showDjMixer ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}
            title="DJ Mixer & Equalizer"
          >
            <Sliders className="w-5 h-5" />
          </button>

          <button
            onClick={handleBluetoothConnect}
            className={`p-2 rounded-full transition-all ${isBluetoothConnected ? 'bg-cyan-500/20 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-slate-400 hover:text-white'}`}
            title="Connect Bluetooth Speaker"
          >
            <Bluetooth className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowLyrics(!showLyrics)} 
            className={`p-2 rounded-full transition-colors ${showLyrics ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'}`}
            title="Lyrics"
          >
            <Mic2 className="w-5 h-5" />
          </button>
          <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white transition-colors">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume}
            onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
            className="w-20 h-1 accent-cyan-400 cursor-pointer"
          />
        </div>

      </div>
    </>
  );
};
