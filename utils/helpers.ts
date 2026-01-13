
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateThumbnail = (file: File): Promise<{ thumbnail: string, duration: number, width: number, height: number }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      // Seek to 10% or 1s to avoid black frames at the start
      video.currentTime = Math.min(1, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      // Maintain aspect ratio for thumbnail
      const aspect = video.videoWidth / video.videoHeight;
      canvas.width = 640;
      canvas.height = 640 / aspect;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      
      resolve({ 
        thumbnail, 
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve({ thumbnail: '', duration: 0, width: 0, height: 0 });
    };
  });
};
