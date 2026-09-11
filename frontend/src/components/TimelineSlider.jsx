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

  const handlePrev = () => {
    if (currentIndex > 0) {
      onChangeIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < dates.length - 1) {
      onChangeIndex(currentIndex + 1);
    }
  };

  const handleTogglePlay = () => {
    if (!isPlaying && currentIndex >= dates.length - 1) {
      onChangeIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-dark-850 border border-dark-700/80 rounded-lg p-3 space-y-2.5">
      {/* Header with Title & Current Selected Date */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>TIMELINE SCRUBBING</span>
        </div>
        <span className="font-mono text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 rounded">
          {currentDate}
        </span>
      </div>

      {/* Playback Controls (Previous, Play/Pause, Next) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className="p-1.5 rounded-md bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous date"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          className={`flex-1 py-1 px-2.5 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
          }`}
          title={isPlaying ? 'Pause timeline playback' : 'Auto-play timeline'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= dates.length - 1}
          className="p-1.5 rounded-md bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white border border-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next date"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Slider Track & Start/End Dates */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={dates.length > 1 ? dates.length - 1 : 0}
          value={currentIndex}
          disabled={dates.length <= 1}
          onChange={(e) => onChangeIndex(Number(e.target.value))}
          className="w-full h-1.5 bg-dark-750 rounded-lg cursor-pointer appearance-none accent-sky-500 disabled:opacity-40"
        />
        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
          <span title={`Start Date: ${dates[0]}`}>{dates[0]}</span>
          <span title={`End Date: ${dates[dates.length - 1]}`}>{dates[dates.length - 1]}</span>
        </div>
      </div>
    </div>
  );
}
