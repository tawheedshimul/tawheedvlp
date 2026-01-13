
import React, { useState } from 'react';
import { Upload, Video, Sparkles, FolderOpen, ShieldCheck, Search } from 'lucide-react';
import { useVideoStore } from '../store';
import { generateThumbnail } from '../utils/helpers';
import { VideoItem } from '../types';

const Uploader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addVideo, setCurrentVideo } = useVideoStore();

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsLoading(true);
    for (const file of files) {
      try {
        const { thumbnail, duration, width, height } = await generateThumbnail(file);
        const newVideo: VideoItem = {
          id: crypto.randomUUID(),
          title: file.name.split('.')[0],
          source: URL.createObjectURL(file),
          type: 'local',
          thumbnail,
          metadata: { duration, width, height, format: file.name.split('.').pop(), size: file.size },
          addedAt: Date.now(),
        };
        addVideo(newVideo);
        if (files.length === 1) setCurrentVideo(newVideo.id);
      } catch (err) {
        console.error('Import failed:', err);
      }
    }
    setIsLoading(false);
  };

  const scanFolder = async () => {
    try {
      // Cast window to any to access the Experimental File System Access API which is not yet in standard lib.dom.d.ts
      const win = window as any;
      if (!win.showDirectoryPicker) {
        alert("Directory Scanning is only supported in modern Chromium browsers (Chrome, Edge).");
        return;
      }
      const dirHandle = await win.showDirectoryPicker();
      setIsLoading(true);
      
      const processEntry = async (handle: any) => {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            // Expanded video check and added common file extensions
            const videoExts = ['mp4', 'mkv', 'webm', 'mov', 'avi', 'mp3', 'ogg', 'wav'];
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (file.type.startsWith('video/') || file.type.startsWith('audio/') || (ext && videoExts.includes(ext))) {
              const { thumbnail, duration, width, height } = await generateThumbnail(file);
              addVideo({
                id: crypto.randomUUID(),
                title: file.name.split('.')[0],
                source: URL.createObjectURL(file),
                type: 'local',
                thumbnail,
                metadata: { duration, width, height, format: ext, size: file.size },
                addedAt: Date.now(),
              });
            }
          } else if (entry.kind === 'directory') {
            await processEntry(entry);
          }
        }
      };
      
      await processEntry(dirHandle);
    } catch (e) {
      console.log('User cancelled or folder access failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="relative group overflow-hidden bg-[#0c0c0c] p-6 lg:p-10 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all duration-700 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-black mb-1 uppercase italic">Import Media</h3>
            <p className="text-white/20 text-[10px] mb-6 font-bold uppercase tracking-widest">MKV, MP4, AVI, WEBM, MP3</p>
            <label className="w-full py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-blue-600 hover:text-white transition-all text-center">
              {isLoading ? 'Processing...' : 'Choose Files'}
              <input type="file" multiple className="hidden" accept="video/*, audio/*, .mkv, .avi, .mov" onChange={handleLocalUpload} disabled={isLoading} />
            </label>
          </div>
        </div>

        <div className="relative group overflow-hidden bg-[#0c0c0c] p-6 lg:p-10 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all duration-700 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black mb-1 uppercase italic">Bulk Scan</h3>
            <p className="text-white/20 text-[10px] mb-6 font-bold uppercase tracking-widest">Index Entire Directories</p>
            <button 
              onClick={scanFolder} disabled={isLoading}
              className="w-full py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white transition-all"
            >
              {isLoading ? 'Scanning...' : 'Sync Folder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Uploader;
