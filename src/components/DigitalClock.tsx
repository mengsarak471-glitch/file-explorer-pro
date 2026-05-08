'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, X, Plus } from 'lucide-react';

interface TimeZone {
  id: string;
  name: string;
  timezone: string;
  time: string;
}

export function DigitalClock() {
  const [timeZones, setTimeZones] = useState<TimeZone[]>([
    { id: '1', name: 'New York', timezone: 'America/New_York', time: '' },
    { id: '2', name: 'London', timezone: 'Europe/London', time: '' },
    { id: '3', name: 'Tokyo', timezone: 'Asia/Tokyo', time: '' },
    { id: '4', name: 'Sydney', timezone: 'Australia/Sydney', time: '' },
  ]);
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Update local time
      setLocalTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );

      // Update timezone times
      setTimeZones((prevTimeZones) =>
        prevTimeZones.map((tz) => ({
          ...tz,
          time: now.toLocaleTimeString('en-US', {
            timeZone: tz.timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }),
        }))
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 mica-bg rounded-2xl shadow-2xl p-6 z-40"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock size={24} className="text-blue-400" />
          <h2 className="text-2xl font-bold">World Clock</h2>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Local Time - Large Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-400/30">
        <p className="text-sm text-gray-300 mb-2">Your Local Time</p>
        <p className="text-4xl font-bold text-blue-300 font-mono">
          {localTime || '--:--:--'}
        </p>
      </div>

      {/* Timezones Grid */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {timeZones.map((tz) => (
          <motion.div
            key={tz.id}
            whileHover={{ x: 4 }}
            className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{tz.name}</p>
              <p className="text-xs text-gray-400">{tz.timezone}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-green-300">
                {tz.time || '--:--:--'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Timezone Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/50 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={18} />
        <span>Add Timezone</span>
      </motion.button>
    </motion.div>
  );
}
