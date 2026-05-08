'use client';

import { motion } from 'framer-motion';
import { useTaskbarStore } from '@/stores/taskbarStore';
import { Search, X } from 'lucide-react';

export function StartMenu() {
  const { isStartMenuOpen, toggleStartMenu, apps } = useTaskbarStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40"
      onClick={toggleStartMenu}
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-24 left-4 w-96 max-h-[600px] mica-bg rounded-2xl shadow-2xl p-6 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Start</h2>
          <button
            onClick={toggleStartMenu}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search apps and settings"
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Pinned Apps Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Pinned</h3>
          <div className="grid grid-cols-4 gap-3">
            {apps
              .filter((app) => app.isPinned)
              .map((app) => (
                <motion.button
                  key={app.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="aspect-square bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-2xl transition-colors"
                >
                  📱
                </motion.button>
              ))}
          </div>
        </div>

        {/* All Apps */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">All apps</h3>
          <div className="space-y-1">
            {apps.map((app) => (
              <motion.div
                key={app.id}
                whileHover={{ x: 4 }}
                className="px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
              >
                <p className="text-sm">{app.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
