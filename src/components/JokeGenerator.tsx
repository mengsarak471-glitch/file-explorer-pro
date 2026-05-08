'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Laugh, RefreshCw, Copy, X } from 'lucide-react';

interface Joke {
  setup: string;
  delivery: string;
}

export function JokeGenerator() {
  const [joke, setJoke] = useState<Joke | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchJoke = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      const data = await response.json();
      setJoke({
        setup: data.setup,
        delivery: data.delivery,
      });
    } catch (error) {
      console.error('Failed to fetch joke:', error);
      setJoke({
        setup: 'Why did the API go to the bar?',
        delivery: 'Because it had too many requests!',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoke();
  }, []);

  const handleCopy = () => {
    if (joke) {
      const jokeText = `${joke.setup}\n${joke.delivery}`;
      navigator.clipboard.writeText(jokeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          <Laugh size={24} className="text-yellow-400" />
          <h2 className="text-2xl font-bold">Joke Generator</h2>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Joke Display */}
      <motion.div
        key={joke?.setup}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-400/30 min-h-40 flex flex-col justify-center"
      >
        <p className="text-sm text-gray-300 mb-4">Setup:</p>
        <p className="text-lg font-semibold text-white mb-6">{joke?.setup}</p>

        {joke && (
          <>
            <p className="text-sm text-gray-300 mb-2">Punchline:</p>
            <p className="text-2xl font-bold text-yellow-300 italic">
              {joke.delivery}
            </p>
          </>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          disabled={loading}
          className="flex-1 py-2 bg-green-500/30 hover:bg-green-500/50 border border-green-400/50 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Copy size={18} />
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchJoke}
          disabled={loading}
          className="flex-1 py-2 bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/50 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Loading...' : 'Next Joke'}</span>
        </motion.button>
      </div>

      {/* API Info */}
      <p className="text-xs text-gray-400 text-center mt-4">
        Powered by Official Joke API
      </p>
    </motion.div>
  );
}
