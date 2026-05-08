'use client';

import { motion } from 'framer-motion';
import { TaskbarApp } from '@/stores/taskbarStore';
import * as Icons from 'lucide-react';

interface TaskbarIconProps {
  app: TaskbarApp;
}

export function TaskbarIcon({ app }: TaskbarIconProps) {
  const IconComponent = (Icons as any)[app.icon] || Icons.Package;

  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center justify-center w-12 h-12 rounded-lg hover:bg-white/10 transition-colors group"
      title={app.name}
    >
      <IconComponent size={20} className="text-gray-300" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute -top-10 bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none"
      >
        {app.name}
      </motion.div>
    </motion.button>
  );
}
