import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Flame } from 'lucide-react';
import { useMemo, useState } from 'react';

interface WaveVisualizerProps {
  currentAmount: number;
  targetAmount: number;
  onQuickAdd: (amount: number, containerType: 'cup' | 'glass' | 'bottle' | 'flask' | 'custom') => void;
  streak: number;
}

export default function WaveVisualizer({
  currentAmount,
  targetAmount,
  onQuickAdd,
  streak,
}: WaveVisualizerProps) {
  const percent = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
  const [waveOffset, setWaveOffset] = useState(0);

  // Array of bubbles with random horizontal starts, sizes, and float durations
  const bubbles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${15 + Math.random() * 70}%`,
      size: 4 + Math.random() * 8, // 4px to 12px
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
    }));
  }, []);

  return (
    <div id="wave-visualizer-container" className="flex flex-col items-center justify-between h-full bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-slate-800 backdrop-blur-md relative overflow-hidden shadow-xl shadow-blue-200/50 dark:shadow-none min-h-[500px]">
      {/* Sparkle icons for 100% achievements */}
      <AnimatePresence>
        {percent >= 100 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-6 right-6 text-amber-500 flex items-center gap-1.5 z-10 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-full border border-amber-200/50 dark:border-amber-900/30 text-xs font-bold"
          >
            <Trophy className="h-4 w-4 text-amber-500 animate-bounce" />
            <span>Target Achieved!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Badge */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950/40 px-3.5 py-1.5 rounded-full border border-blue-200/50 dark:border-blue-900/30 text-xs font-bold text-blue-700 dark:text-blue-400">
        <Flame className="h-4 w-4 fill-blue-500 text-blue-500" />
        <span>{streak} Days Streak</span>
      </div>

      <div className="text-center mt-8 z-10">
        <h2 className="text-xs font-bold tracking-widest uppercase text-blue-400 dark:text-blue-500">
          Progress Today
        </h2>
        <div className="flex items-baseline justify-center gap-1 mt-1 mb-1">
          <span className="text-7xl font-black tracking-tight text-blue-600 dark:text-blue-400 font-sans">
            {percent}<span className="text-3xl font-extrabold">%</span>
          </span>
        </div>
        <p className="text-sm font-bold text-blue-900 dark:text-blue-200 opacity-90">
          {(currentAmount / 1000).toFixed(1)}L <span className="text-blue-300 dark:text-blue-500">/ {(targetAmount / 1000).toFixed(1)}L</span>
        </p>
      </div>

      {/* Animated Beaker/Glass */}
      <div className="relative w-64 h-72 my-4 flex items-center justify-center">
        {/* Outer glass boundary */}
        <div
          id="glass-frame"
          className="relative w-52 h-64 border-4 border-blue-200 dark:border-slate-705 rounded-b-[3.5rem] rounded-t-lg overflow-hidden shadow-lg bg-blue-50/20 dark:bg-slate-950/10 backdrop-blur-[1px]"
        >
          {/* Top rim accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-100 dark:border-slate-700 opacity-60"></div>

          {/* Liquid content wrapper that rises scaled matching the percentage */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 w-full transition-all duration-700 ease-out bg-blue-500"
            style={{ height: `${percent}%` }}
          >
            {/* Liquid Color & Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400 opacity-90"></div>

            {/* Reflection sheen highlight */}
            <div className="absolute top-0 bottom-0 left-4 w-3 bg-white/20 blur-[1px] rounded-full"></div>

            {/* Waves SVG animated */}
            <div className="absolute -top-6 left-0 right-0 h-10 overflow-visible w-[500px]">
              <svg
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
                className="absolute w-[200%] h-6 text-blue-300 fill-current opacity-80 -top-2 animate-[wave-one_8s_linear_infinite]"
                style={{ transform: 'translateX(-50%)' }}
              >
                <path d="M 0 10 Q 25 5, 50 10 T 100 10 T 150 10 T 200 10 L 200 20 L 0 20 Z" />
              </svg>
              <svg
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
                className="absolute w-[200%] h-6 text-blue-500 fill-current -top-1 opacity-90 animate-[wave-two_6s_linear_infinite]"
                style={{ transform: 'translateX(-40%)' }}
              >
                <path d="M 0 10 Q 25 15, 50 10 T 100 10 T 150 10 T 200 10 L 200 20 L 0 20 Z" />
              </svg>
            </div>

            {/* Bubbles floating inside the water */}
            {percent > 5 &&
              bubbles.map((b) => (
                <motion.div
                  key={b.id}
                  style={{
                    position: 'absolute',
                    left: b.left,
                    width: b.size,
                    height: b.size,
                    bottom: 0,
                  }}
                  animate={{
                    y: ['0px', `-${(percent / 100) * 240}px`],
                    opacity: [0, 0.8, 0.8, 0],
                  }}
                  transition={{
                    duration: b.duration,
                    repeat: Infinity,
                    delay: b.delay,
                    ease: 'easeOut',
                  }}
                  className="rounded-full bg-white/40 ring-1 ring-white/10"
                />
              ))}
          </motion.div>

          {/* Water level lines indicator */}
          <div className="absolute inset-y-0 right-4 flex flex-col justify-between py-10 pointer-events-none select-none text-right text-[10px] font-mono text-blue-300/80 dark:text-slate-650/80">
            <div>75%</div>
            <div>50%</div>
            <div>25%</div>
          </div>
        </div>

        {/* Ambient Ring Glow if hydration goal met */}
        {percent >= 100 && (
          <div className="absolute -inset-4 border-2 border-amber-400/40 rounded-b-[4.5rem] rounded-t-xl animate-pulse -z-10 blur-xl"></div>
        )}
      </div>

      {/* Giant quick drink touch target for easier manual logging */}
      <div className="w-full text-center z-10 flex flex-col items-center gap-1.5 mt-2">
        <button
          onClick={() => onQuickAdd(250, 'glass')}
          className="w-full max-w-[220px] py-4 px-8 rounded-3xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-black transition-all shadow-lg shadow-blue-500/30 active:shadow-none inline-flex items-center justify-center gap-2"
        >
          <Sparkles className="h-5 w-5" />
          <span>Quick Sip +250ml</span>
        </button>
        <span className="text-xxs text-blue-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
          Or log custom portions below
        </span>
      </div>

      {/* Styled inline waves animation via index.css wrapper or style block */}
      <style>{`
        @keyframes wave-one {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-two {
          0% { transform: translateX(-50%); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
