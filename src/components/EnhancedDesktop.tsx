'use client';

import { useState } from 'react';
import { Desktop } from './Desktop';
import { DigitalClock } from './DigitalClock';
import { JokeGenerator } from './JokeGenerator';
import { AnimatePresence } from 'framer-motion';

export function EnhancedDesktop() {
  const [showClock, setShowClock] = useState(false);
  const [showJoke, setShowJoke] = useState(false);

  return (
    <>
      <Desktop
        onOpenClock={() => setShowClock(true)}
        onOpenJoke={() => setShowJoke(true)}
      />
      <AnimatePresence>
        {showClock && (
          <div onClick={() => setShowClock(false)}>
            <DigitalClock />
          </div>
        )}
        {showJoke && (
          <div onClick={() => setShowJoke(false)}>
            <JokeGenerator />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
