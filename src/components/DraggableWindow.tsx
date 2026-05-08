'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWindowStore, WindowState } from '@/stores/windowStore';
import { Minus, Maximize2, X } from 'lucide-react';

interface DraggableWindowProps {
  window: WindowState;
}

export function DraggableWindow({ window }: DraggableWindowProps) {
  const { closeWindow, toggleMinimize, toggleMaximize, updateWindowPosition, bringToFront } = useWindowStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - window.x,
      y: e.clientY - window.y,
    });
    bringToFront(window.id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateWindowPosition(window.id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, window.id, updateWindowPosition]);

  if (window.isMinimized) return null;

  return (
    <motion.div
      ref={windowRef}
      initial={{ opacity: 0, scale: 0.9, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -50 }}
      style={{
        position: 'absolute',
        left: window.x,
        top: window.y,
        width: window.isMaximized ? '100%' : window.width,
        height: window.isMaximized ? '100%' : window.height,
        zIndex: window.zIndex,
      }}
      className={`mica-bg rounded-xl overflow-hidden shadow-2xl flex flex-col ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="h-10 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/10 flex items-center justify-between px-4 cursor-grab hover:bg-white/15 transition-colors"
      >
        <h2 className="text-sm font-semibold text-white flex-1">{window.title}</h2>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleMinimize(window.id)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Minus size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleMaximize(window.id)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Maximize2 size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => closeWindow(window.id)}
            className="p-1 hover:bg-red-500/30 rounded transition-colors"
          >
            <X size={16} />
          </motion.button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-auto p-4 text-white">
        <p>Window content for {window.title}</p>
      </div>
    </motion.div>
  );
}
