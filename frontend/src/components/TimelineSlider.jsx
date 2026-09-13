import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
} from 'lucide-react';

export function TimelineSlider({
  dates = [],
  currentIndex = 0,
  onChangeIndex,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x | 2x | 4x

  // Playback timer
  useEffect(() => {
    let interval = null;
    if (isPlaying && dates.length > 0) {
      const baseDelay = 1200;
      const delay = Math.max(300, baseDelay / speed);

      interval = setInterval(() => {
        onChangeIndex((prev) => {
          if (prev >= dates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed, dates.length, onChangeIndex]);

  if (!dates || dates.length === 0) return null;

  const currentDate = dates[currentIndex] || dates[dates.length - 1];

  const handleStepBack = () => {
    setIsPlaying(false);
    onChangeIndex(Math.max(0, currentIndex - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    onChangeIndex(Math.min(dates.length - 1, currentIndex + 1));
  };

  const cycleSpeed = () => {
    if (speed === 1) setSpeed(2);
    else if (speed === 2) setSpeed(4);
    else setSpeed(1);
  };

  return (
    <div className="bg-dark-900/90 border border-dark-800 rounded-xl p-3.5 space-y-2.5 shadow-md text-slate-200 select-none">
      {/* Header & Date Readouts */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Temporal Playback
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">
            FRAME {currentIndex + 1} OF {dates.length}
          </span>
          <span className="font-mono font-bold text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-md shadow-sm">
            {currentDate}
          </span>
        </div>
      </div>

      {/* Slider Track & Min/Max Date Bounds */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={dates.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onChangeIndex(Number(e.target.value));
            }}
            className="w-full h-2 bg-dark-950 rounded-lg cursor-pointer appearance-none accent-orange-500 focus:outline-none border border-dark-800"
          />
        </div>

        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>{dates[0]} (T-Initial)</span>
          <span>{dates[dates.length - 1]} (Latest NRT)</span>
        </div>
      </div>

      {/* Playback Controls & Frame Steppers & Speed Multiplier */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        {/* Reset / Day 1 */}
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onChangeIndex(0);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all cursor-pointer"
          title="Reset to Oldest Ingestion Frame"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Step 1 Day Backward */}
        <button
          type="button"
          onClick={handleStepBack}
          disabled={currentIndex <= 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all disabled:opacity-30 cursor-pointer"
          title="Step 1 Frame Backward"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Main Play / Pause Button */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-xl text-white shadow-lg transition-all transform active:scale-95 cursor-pointer ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-orange-500/30'
              : 'bg-gradient-to-r from-sky-500 to-cyan-600 shadow-sky-500/30 hover:scale-105'
          }`}
          title={isPlaying ? 'Pause Historical Playback' : 'Play Historical Progression'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Step 1 Day Forward */}
        <button
          type="button"
          onClick={handleStepForward}
          disabled={currentIndex >= dates.length - 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all disabled:opacity-30 cursor-pointer"
          title="Step 1 Frame Forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Fast Forward to Latest */}
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onChangeIndex(dates.length - 1);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-850 border border-transparent hover:border-dark-700 transition-all cursor-pointer"
          title="Fast-forward to Latest Ingestion Frame"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed Multiplier Pill */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-dark-950 hover:bg-dark-850 border border-dark-800 text-sky-400 transition-all cursor-pointer"
          title="Change playback speed"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}


