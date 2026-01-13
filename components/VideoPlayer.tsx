import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, 
  ChevronRight, Fullscreen, Monitor, Info, Clock, Heart, 
  RotateCcw, Zap, ExternalLink, Sun, AlertCircle,
  Subtitles, Gauge
} from 'lucide-react';
import { VideoItem } from '../types';
import { formatTime } from '../utils/helpers';
import { useVideoStore } from '../store';

interface VideoPlayerProps {
  video: VideoItem;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [skipFeedback, setSkipFeedback] = useState<'left' | 'right' | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  
  const { settings, updateSettings, updateVideoProgress } = useVideoStore();
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (videoRef.current?.paused) videoRef.current.play();
    else videoRef.current?.pause();
  }, []);

  const toggleMute = useCallback(() => {
    updateSettings({ isMuted: !settings.isMuted });
  }, [settings.isMuted, updateSettings]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
      else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    }
  }, []);

  const seek = useCallback((amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      setSkipFeedback(amount < 0 ? 'left' : 'right');
      setTimeout(() => setSkipFeedback(null), 500);
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase() || '')) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          updateSettings({ volume: Math.min(1, settings.volume + 0.1) });
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateSettings({ volume: Math.max(0, settings.volume - 0.1) });
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, seek, settings.volume, updateSettings]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !video.source) return;

    setLoadError(false);
    videoEl.src = video.source;
    videoEl.playbackRate = settings.playbackRate;
    videoEl.volume = settings.volume;
    videoEl.muted = settings.isMuted;

    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
      if (videoEl.buffered.length > 0) {
        setBuffered(videoEl.buffered.end(videoEl.buffered.length - 1));
      }
      updateVideoProgress(video.id, videoEl.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoEl.duration);
      if (video.progress) videoEl.currentTime = video.progress;
    };

    const handleError = () => setLoadError(true);

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('error', handleError);
    videoEl.addEventListener('play', () => setIsPlaying(true));
    videoEl.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('error', handleError);
    };
  }, [video.id, video.source]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = settings.playbackRate;
      videoRef.current.volume = settings.volume;
      videoRef.current.muted = settings.isMuted;
    }
  }, [settings.playbackRate, settings.volume, settings.isMuted]);

  const lastTapRef = useRef<{time: number, x: number} | null>(null);
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const x = 'touches' in (e as any) ? (e as any).touches[0].clientX : (e as any).clientX;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const relativeX = x - rect.left;
    const isLeftSide = relativeX < rect.width / 2;

    if (lastTapRef.current && (now - lastTapRef.current.time) < 300) {
      seek(isLeftSide ? -10 : 10);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x };
      if (isPlaying) handleMouseMove();
      else togglePlay();
    }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (videoRef.current) await videoRef.current.requestPictureInPicture();
    } catch (e) { console.error(e); }
  };

  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSubtitleUrl(url);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative group bg-black overflow-hidden select-none transition-all duration-700 rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-white/5 aspect-video w-full"
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain pointer-events-auto"
        onClick={handleTap}
        playsInline
      >
        {subtitleUrl && (
          <track 
            src={subtitleUrl} 
            kind="subtitles" 
            srcLang="en" 
            label="English" 
            default 
          />
        )}
      </video>

      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/95 text-center p-6 z-30">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-black uppercase italic mb-2 tracking-tighter">Codec Error</h3>
          <p className="text-white/40 text-[10px] max-w-sm font-bold uppercase tracking-widest leading-relaxed">
            Format not supported natively. Use MP4/AAC for best results.
          </p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl">Retry</button>
        </div>
      )}

      {skipFeedback && (
        <div className={`absolute inset-y-0 ${skipFeedback === 'left' ? 'left-0' : 'right-0'} w-1/3 flex items-center justify-center bg-white/5 backdrop-blur-md pointer-events-none animate-in fade-in zoom-in duration-300 z-10`}>
          <div className="flex flex-col items-center gap-2">
            <RotateCcw className={`w-8 h-8 md:w-16 md:h-16 ${skipFeedback === 'left' ? '' : 'rotate-180'}`} />
            <span className="font-black text-xs md:text-2xl">{skipFeedback === 'left' ? '-' : '+'}10s</span>
          </div>
        </div>
      )}

      {isSpeedMenuOpen && (
        <div className="absolute bottom-20 right-4 lg:right-12 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl lg:rounded-3xl p-2 lg:p-3 z-50 animate-in slide-in-from-bottom-4 shadow-2xl max-h-48 lg:max-h-64 overflow-y-auto">
          <div className="text-[8px] font-black uppercase tracking-widest opacity-30 px-3 mb-2">Speed</div>
          {PLAYBACK_SPEEDS.map(speed => (
            <button
              key={speed}
              onClick={() => { updateSettings({ playbackRate: speed }); setIsSpeedMenuOpen(false); }}
              className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                settings.playbackRate === speed ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              {speed === 1 ? 'Normal' : `${speed}x`}
            </button>
          ))}
        </div>
      )}

      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 ${!isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} z-10`}>
        {!isPlaying && !loadError && (
          <button onClick={togglePlay} className="p-6 md:p-12 bg-blue-600/90 backdrop-blur-2xl rounded-full border border-white/20 shadow-2xl pointer-events-auto hover:scale-110 active:scale-90 transition-all">
            <Play className="w-8 h-8 md:w-16 md:h-16 text-white fill-white ml-1 md:ml-2" />
          </button>
        )}
      </div>

      <div className={`absolute bottom-0 inset-x-0 p-3 md:p-10 video-gradient transition-all duration-500 ${showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'} z-20`}>
        
        {/* Progress Bar */}
        <div className="relative h-1.5 md:h-3 w-full bg-white/10 rounded-full mb-4 md:mb-10 cursor-pointer group/seek overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-white/20 rounded-full transition-all duration-300" style={{ width: `${(buffered / duration) * 100}%` }} />
          <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full shadow-[0_0_20px_#2563eb]" style={{ width: `${(currentTime / duration) * 100}%` }} />
          <input 
            type="range" min="0" max={duration || 0} step="0.01" value={currentTime}
            onChange={(e) => videoRef.current && (videoRef.current.currentTime = parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-10">
            <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-all active:scale-75 disabled:opacity-20" disabled={loadError}>
              {isPlaying ? <Pause className="w-6 h-6 md:w-10 md:h-10 fill-current" /> : <Play className="w-6 h-6 md:w-10 md:h-10 fill-current" />}
            </button>
            
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={toggleMute} className="text-white hover:text-blue-500 transition-colors">
                {settings.isMuted || settings.volume === 0 ? <VolumeX className="w-5 h-5 md:w-7 md:h-7" /> : <Volume2 className="w-5 h-5 md:w-7 md:h-7" />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.01" value={settings.volume}
                onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                className="w-16 md:w-32 transition-all h-1 accent-blue-500 cursor-pointer rounded-full"
              />
            </div>
            
            <span className="text-[9px] md:text-base font-black tabular-nums opacity-60 tracking-wider">
              {formatTime(currentTime)} <span className="opacity-20 mx-0.5">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-8">
            <button onClick={() => subtitleInputRef.current?.click()} className="text-white hover:text-blue-500 transition-all relative">
              <Subtitles className={`w-5 h-5 md:w-7 md:h-7 ${subtitleUrl ? 'text-blue-500' : 'opacity-40'}`} />
              <input type="file" ref={subtitleInputRef} accept=".vtt,.srt" onChange={handleSubtitleUpload} className="hidden" />
              {subtitleUrl && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
            </button>

            <button 
              onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)} 
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 hover:border-blue-500 transition-all ${isSpeedMenuOpen ? 'bg-blue-600 border-blue-600' : 'bg-white/5'}`}
            >
              <Gauge className="w-4 h-4 md:w-6 md:h-6" />
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{settings.playbackRate}x</span>
            </button>

            <button onClick={togglePiP} className="text-white hover:text-blue-500 transition-colors hidden md:block">
              <ExternalLink className="w-5 h-5 md:w-7 md:h-7" />
            </button>
            
            <button onClick={toggleFullscreen} className="text-white hover:text-blue-500 transition-colors">
              <Maximize className="w-5 h-5 md:w-7 md:h-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
