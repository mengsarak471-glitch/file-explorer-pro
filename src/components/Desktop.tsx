'use client';

import { useState, useEffect } from 'react';
import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';
import { DesktopIcon } from './DesktopIcon';

export function Desktop() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-win11-bg to-slate-950 overflow-hidden">
      {/* Desktop background with subtle grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 space-y-4 z-10">
        <DesktopIcon name="File Explorer" icon="FolderOpen" />
        <DesktopIcon name="Settings" icon="Settings" />
        <DesktopIcon name="Recycle Bin" icon="Trash2" />
      </div>

      {/* Windows Manager */}
      <WindowManager />

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
