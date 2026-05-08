'use client';

import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface DesktopIconProps {
  name: string;
  icon: string;
}

export function DesktopIcon({ name, icon }: DesktopIconProps) {
  const IconComponent = (Icons as any)[icon] || Icons.Package;

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="flex flex-col items-center gap-2 w-24 cursor-pointer group"
    >
      <motion.div
        className="w-16 h-16 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
      >
        <IconComponent size={32} className="text-white" />
      </motion.div>
      <p className="text-xs text-white text-center line-clamp-2 group-hover:bg-blue-500/20 px-1 py-1 rounded">
        {name}
      </p>
    </motion.div>
  );
}
