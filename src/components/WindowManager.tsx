'use client';

import { useWindowStore } from '@/stores/windowStore';
import { DraggableWindow } from './DraggableWindow';

export function WindowManager() {
  const { windows } = useWindowStore();

  return (
    <div className="relative w-full h-full">
      {windows.map((window) => (
        <DraggableWindow key={window.id} window={window} />
      ))}
    </div>
  );
}
