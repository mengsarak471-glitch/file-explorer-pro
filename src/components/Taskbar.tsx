'use client';

import { useTaskbarStore } from '@/stores/taskbarStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { StartMenu } from './StartMenu';
import { TaskbarIcon } from './TaskbarIcon';

export function Taskbar() {
  const { isStartMenuOpen, toggleStartMenu, apps } = useTaskbarStore();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const pinnedApps = apps.filter((app) => app.isPinned);

  return (
    <>
      {/* Taskbar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 h-20 mica-bg border-t border-white/10 flex items-center justify-between px-4 z-50"
      >
        {/* Start Menu Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleStartMenu}
          className="relative flex items-center justify-center w-12 h-12 rounded-md hover:bg-white/10 transition-colors"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">W</div>
        </motion.button>

        {/* Pinned Apps */}
        <div className="flex items-center gap-2 flex-1 ml-4">
          <div className="flex items-center gap-1">
            {pinnedApps.map((app) => (
              <TaskbarIcon key={app.id} app={app} />
            ))}
          </div>
        </div>

        {/* System Tray */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Clock size={16} />
            <span>{time || '--:--'}</span>
          </div>
        </div>
      </motion.div>

      {/* Start Menu */}
      <AnimatePresence>
        {isStartMenuOpen && <StartMenu />}
      </AnimatePresence>
    </>
  );
}
