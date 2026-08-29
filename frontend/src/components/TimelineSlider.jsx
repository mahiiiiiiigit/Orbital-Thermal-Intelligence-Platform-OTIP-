import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Calendar } from 'lucide-react';

export function TimelineSlider({
  dates = [],
  currentIndex = 0,
  onChangeIndex,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isPlaying && dates.length > 0) {
      interval = setInterval(() => {
        onChangeIndex((prev) => {
          if (prev >= dates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, dates.length, onChangeIndex]);

  if (!dates || dates.length === 0) return null;

  const currentDate = dates[currentIndex] || dates[dates.length - 1];

  return (
    <div className="bg-white/95 dark:bg-dark-850/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3 w-full max-w-xl transition-colors duration-200">
      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChangeIndex(0)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset to Day 1"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 transition-colors"
          title={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => onChangeIndex(dates.length - 1)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fast-forward to Latest"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Slider Track */}
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center text-[11px]">
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Calendar className="w-3 h-3 text-sky-500 dark:text-sky-400" />
            <span>Timeline Scrubbing:</span>
          </div>
          <span className="font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/40 px-2 py-0.5 rounded">
            {currentDate}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={dates.length - 1}
          value={currentIndex}
          onChange={(e) => onChangeIndex(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg cursor-pointer appearance-none"
        />
        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>{dates[0]}</span>
          <span>{dates[dates.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}
