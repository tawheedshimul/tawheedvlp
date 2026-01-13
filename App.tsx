import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, Trash2, History, Heart, Library, Search, Clock, 
  ChevronRight, LayoutGrid, Download, Smartphone, X
} from 'lucide-react';
import { useVideoStore } from './store';
import VideoPlayer from './components/VideoPlayer';
import Uploader from './components/Uploader';
import { formatTime, formatFileSize } from './utils/helpers';

type ViewType = 'library' | 'collection' | 'recent';

const App: React.FC = () => {
  const { videos, currentVideoId, setCurrentVideo, removeVideo, clearHistory, toggleFavorite } = useVideoStore();
  const [currentView, setCurrentView] = useState<ViewType>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const currentVideo = videos.find(v => v.id === currentVideoId);

  // Instant Search Filtering Logic
  const displayVideos = useMemo(() => {
    let base = videos;
    if (currentView === 'collection') {
      base = videos.filter(v => v.favorite);
    } else if (currentView === 'recent') {
      base = [...videos].sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
    }
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return base;

    return base.filter(v => 
      v.title.toLowerCase().includes(query) || 
      (v.metadata?.format && v.metadata.format.toLowerCase().includes(query))
    );
  }, [videos, searchQuery, currentView]);

  const NavItem = ({ icon: Icon, label, view }: { icon: any, label: string, view: ViewType }) => (
    <button 
      onClick={() => { setCurrentView(view); setCurrentVideo(null); setSearchQuery(''); }}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${
        currentView === view ? 'bg-blue-600 text-white shadow-lg' : 'text-white/30 hover:bg-white/5'
      }`}
    >
      <Icon className="w-5 h-5" /> {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#050505] text-white overflow-x-hidden">
      
      {/* Sidebar - Desktop Only (Fixed) */}
      <aside className="w-72 border-r border-white/5 p-8 hidden lg:flex flex-col fixed h-full bg-[#070707] z-[110]">
        <div className="flex items-center gap-3 mb-16 px-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">tawheed</span>
        </div>
        
        <nav className="space-y-4 flex-1">
          <NavItem icon={Library} label="Library" view="library" />
          <NavItem icon={Heart} label="Collection" view="collection" />
          <NavItem icon={History} label="History" view="recent" />
        </nav>

        <div className="space-y-4 pt-8 border-t border-white/5">
          {deferredPrompt && (
            <button onClick={installApp} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest animate-pulse">
              <Download className="w-5 h-5" /> Install Software
            </button>
          )}
          <button onClick={clearHistory} className="w-full flex items-center gap-4 px-6 py-4 text-red-500/40 hover:text-red-500 transition-all font-black text-[10px] uppercase tracking-widest">
            <Trash2 className="w-5 h-5" /> Clear Vault
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 transition-all duration-700 pb-24 lg:pb-12 pt-[72px] lg:pt-[88px]">
        
        {/* Top Fixed Header */}
        <header className="fixed top-0 right-0 left-0 lg:left-72 z-[100] bg-[#050505]/95 backdrop-blur-3xl border-b border-white/5 px-4 md:px-8 lg:px-12 py-3 lg:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
               <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase italic">tawheed</span>
          </div>
          
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder={`Instant search ${currentView}...`} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-2 lg:py-3 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-bold text-xs lg:text-sm placeholder:text-white/20"
            />
          </div>

          <div className="hidden lg:flex items-center gap-4">
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-black tracking-widest uppercase opacity-40">Secure Media Vault</span>
               <span className="text-[10px] font-black tracking-tighter uppercase italic text-blue-500">v1.3 Premium</span>
             </div>
          </div>
        </header>

        {/* Mobile Install Prompt Banner */}
        {deferredPrompt && (
          <div className="lg:hidden mx-4 mt-4 p-4 bg-blue-600 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-2xl relative z-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest">tawheed App</span>
                <span className="text-[10px] opacity-80">Install for best performance</span>
              </div>
            </div>
            <button onClick={installApp} className="px-4 py-2 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest">Install</button>
          </div>
        )}

        <div className="p-4 md:p-8 lg:p-12 space-y-12">
          {currentVideo ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentVideo(null)} className="flex items-center gap-2 text-white/40 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back
                </button>
                <button 
                  onClick={() => toggleFavorite(currentVideo.id)}
                  className={`p-2 rounded-xl transition-all ${currentVideo.favorite ? 'text-red-500 bg-red-500/10' : 'text-white/20 bg-white/5'}`}
                >
                  <Heart className={`w-5 h-5 ${currentVideo.favorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <VideoPlayer video={currentVideo} />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                  <div>
                    <h1 className="text-2xl md:text-5xl font-black mb-4 tracking-tighter leading-tight break-words uppercase italic">{currentVideo.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 md:gap-8">
                      <p className="text-white/30 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2"><Clock className="w-3 h-3" /> Added {new Date(currentVideo.addedAt).toLocaleDateString()}</p>
                      <div className="flex items-center gap-2 text-blue-500 font-black text-[9px] uppercase tracking-widest"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Hardware Optimized</div>
                    </div>
                  </div>
                  <div className="bg-[#0c0c0c] p-6 md:p-10 rounded-[2rem] border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[{l:'Resolution', v:`${currentVideo.metadata?.width}p`}, {l:'Size', v:formatFileSize(currentVideo.metadata?.size || 0)}, {l:'Bitrate', v:'Optimal'}, {l:'Format', v:currentVideo.metadata?.format?.toUpperCase() || 'N/A'}].map(i => (
                      <div key={i.l} className="space-y-1">
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-30">{i.l}</div>
                        <div className="font-black text-sm md:text-lg">{i.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 px-2">Next in Vault</h3>
                  <div className="space-y-3">
                    {displayVideos.filter(v => v.id !== currentVideo.id).slice(0, 8).map(v => (
                      <button key={v.id} onClick={() => setCurrentVideo(v.id)} className="w-full flex gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all text-left group">
                        <div className="w-24 md:w-32 aspect-video rounded-xl bg-zinc-900 overflow-hidden relative border border-white/5 flex-shrink-0">
                          {v.thumbnail && <img src={v.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                          <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-black">{formatTime(v.metadata?.duration || 0)}</div>
                        </div>
                        <div className="min-w-0 py-1">
                          <h4 className="font-black text-[10px] md:text-xs text-white/80 line-clamp-2 leading-tight uppercase italic group-hover:text-blue-500 transition-colors">{v.title}</h4>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Uploader />
              
              <div className="mt-12 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest italic flex items-center gap-3">
                    {currentView === 'library' && <><Library className="w-6 h-6 text-blue-500" /> Vault</>}
                    {currentView === 'collection' && <><Heart className="w-6 h-6 text-red-500" /> Collection</>}
                    {currentView === 'recent' && <><History className="w-6 h-6 text-emerald-500" /> History</>}
                  </h2>
                  <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{displayVideos.length} Assets</div>
                </div>

                {displayVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayVideos.map(v => (
                      <div key={v.id} onClick={() => setCurrentVideo(v.id)} className="group cursor-pointer">
                        <div className="aspect-video rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl relative">
                          {v.thumbnail ? <img src={v.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Play className="w-12 h-12" /></div>}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Play className="w-10 h-10 fill-white text-white" />
                          </div>
                          {v.progress && (
                            <div className="absolute bottom-0 left-0 h-1 bg-blue-600 shadow-[0_0_10px_#2563eb]" style={{width: `${Math.min(100, (v.progress/(v.metadata?.duration||1))*100)}%`}} />
                          )}
                        </div>
                        <div className="mt-4 flex items-start justify-between px-2">
                          <div className="min-w-0 pr-2">
                            <h3 className="font-black text-xs md:text-sm uppercase italic truncate leading-none mb-1">{v.title}</h3>
                            <div className="flex items-center gap-2">
                              {v.favorite && <Heart className="w-3 h-3 text-red-500 fill-current" />}
                              <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">{v.metadata?.format?.toUpperCase() || 'MEDIA'} • {formatTime(v.metadata?.duration || 0)}</span>
                            </div>
                          </div>
                          <button onClick={(e) => {e.stopPropagation(); removeVideo(v.id)}} className="text-white/10 hover:text-red-500 transition-colors flex-shrink-0 p-1 -mt-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 md:py-40 text-center opacity-20 font-black uppercase tracking-[0.4em] bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 mx-2 flex flex-col items-center gap-4">
                    <Search className="w-12 h-12 opacity-40" />
                    {searchQuery ? 'Asset not found' : `Your vault is empty`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#070707]/90 backdrop-blur-2xl border-t border-white/5 flex lg:hidden items-center justify-around py-3 px-6 z-50 safe-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => { setCurrentView('library'); setCurrentVideo(null); setSearchQuery(''); }}
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'library' ? 'text-blue-500 scale-110' : 'text-white/30'}`}
        >
          <Library className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-widest">Vault</span>
        </button>
        <button 
          onClick={() => { setCurrentView('collection'); setCurrentVideo(null); setSearchQuery(''); }}
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'collection' ? 'text-red-500 scale-110' : 'text-white/30'}`}
        >
          <Heart className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-widest">Liked</span>
        </button>
        <button 
          onClick={() => { setCurrentView('recent'); setCurrentVideo(null); setSearchQuery(''); }}
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'recent' ? 'text-emerald-500 scale-110' : 'text-white/30'}`}
        >
          <History className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-widest">History</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
