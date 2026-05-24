import { useState, FormEvent } from 'react';
import { CupSoda, GlassWater, Beer, Sparkles, Plus, Fuel } from 'lucide-react';

interface ContainerPreset {
  type: 'cup' | 'glass' | 'bottle' | 'flask' | 'custom';
  name: string;
  amountMl: number;
  icon: any;
  colorBg: string;
  colorText: string;
}

interface QuickAddPanelProps {
  onAddWater: (amountMl: number, containerType: 'cup' | 'glass' | 'bottle' | 'flask' | 'custom') => void;
  unit: 'ml' | 'oz';
}

export default function QuickAddPanel({ onAddWater, unit }: QuickAddPanelProps) {
  const [customValue, setCustomValue] = useState<number>(300);

  const presets: ContainerPreset[] = [
    {
      type: 'cup',
      name: 'Tea Cup',
      amountMl: 150,
      icon: CupSoda,
      colorBg: 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100',
      colorText: 'text-blue-600 dark:text-blue-400',
    },
    {
      type: 'glass',
      name: 'Regular Glass',
      amountMl: 250,
      icon: GlassWater,
      colorBg: 'bg-blue-100 hover:bg-blue-250 text-blue-800 dark:bg-blue-900/30',
      colorText: 'text-blue-700 dark:text-blue-300',
    },
    {
      type: 'bottle',
      name: 'Big Bottle',
      amountMl: 500,
      icon: Fuel,
      colorBg: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/10',
      colorText: 'text-white',
    },
    {
      type: 'flask',
      name: 'Sports Flask',
      amountMl: 750,
      icon: Beer,
      colorBg: 'bg-blue-900 hover:bg-blue-950 text-white shadow-md',
      colorText: 'text-white',
    },
  ];

  const getConvertedLabel = (ml: number) => {
    if (unit === 'oz') {
      return `${Math.round(ml * 0.033814)} oz (${ml} ml)`;
    }
    return `${ml} ml`;
  };

  const handleCustomAdd = (e: FormEvent) => {
    e.preventDefault();
    if (customValue <= 0) return;
    onAddWater(customValue, 'custom');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-blue-50 dark:border-slate-800 p-6 rounded-[32px] shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-650 dark:text-blue-400">
            <GlassWater className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-blue-900 dark:text-slate-100 text-base leading-tight">Log Container</h3>
            <p className="text-xs text-blue-400 dark:text-slate-500 font-medium">Pick a container preset size or customize</p>
          </div>
        </div>

        {/* Preset buttons grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {presets.map((p) => {
            const Icon = p.icon;
            const isWhiteText = p.colorText === 'text-white';
            return (
              <button
                key={p.type}
                type="button"
                onClick={() => onAddWater(p.amountMl, p.type)}
                className={`p-4 rounded-3xl border border-blue-10/50 dark:border-slate-850 transition-all text-left flex items-start gap-3 select-none active:scale-95 group ${p.colorBg}`}
              >
                <div className={`p-2.5 rounded-2xl transition-transform group-hover:scale-110 ${
                  isWhiteText 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white dark:bg-slate-900 ' + p.colorText
                } shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className={`text-xs font-bold leading-tight ${isWhiteText ? 'text-white' : 'text-blue-900 dark:text-slate-200'}`}>
                    {p.name}
                  </div>
                  <div className={`text-xs font-black font-mono mt-1 ${isWhiteText ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                    {getConvertedLabel(p.amountMl)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom sliding slider */}
      <div className="border-t border-blue-50 dark:border-slate-950 pt-5">
        <form onSubmit={handleCustomAdd} className="space-y-4">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-bold text-blue-900/60 dark:text-slate-400 uppercase tracking-widest">
              Custom Log Portion
            </label>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
              {getConvertedLabel(customValue)}
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="50"
              max="1500"
              step="25"
              value={customValue}
              onChange={(e) => setCustomValue(Number(e.target.value))}
              className="w-full h-1.5 bg-blue-50 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-blue-400 dark:text-slate-500 font-semibold px-0.5">
              <span>50 ml</span>
              <span>250 ml</span>
              <span>500 ml</span>
              <span>750 ml</span>
              <span>1000 ml</span>
              <span>1500 ml</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition-with-duration shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 inline-block mr-1" />
            <span>Record Custom Amount</span>
          </button>
        </form>
      </div>
    </div>
  );
}
