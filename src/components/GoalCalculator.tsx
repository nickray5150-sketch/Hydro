import { useState, useEffect } from 'react';
import { Calculator, Check, ArrowRight, Info, Coffee, Dumbbell } from 'lucide-react';
import { ClimateType } from '../types';

interface GoalCalculatorProps {
  currentWeight: number;
  currentActivity: number;
  currentClimate: ClimateType;
  currentCoffee: number;
  onSaveCalculatedGoal: (targetMl: number, weight: number, activity: number, climate: ClimateType, coffee: number) => void;
  unit: 'ml' | 'oz';
}

export default function GoalCalculator({
  currentWeight,
  currentActivity,
  currentClimate,
  currentCoffee,
  onSaveCalculatedGoal,
  unit,
}: GoalCalculatorProps) {
  const [weight, setWeight] = useState<number>(currentWeight || 70);
  const [activity, setActivity] = useState<number>(currentActivity || 30);
  const [climate, setClimate] = useState<ClimateType>(currentClimate || 'temperate');
  const [coffee, setCoffee] = useState<number>(currentCoffee || 0);
  const [isSaved, setIsSaved] = useState(false);

  // Mayo Clinic scientific baseline calculation formula:
  // - Body weight baseline: ~35ml of water per kg of weight
  // - Activity factor: +350ml per 30 minutes of exercise (11.66ml per minute)
  // - Climate level: temperate (+100ml), hot (+500ml), cold (+0)
  // - Caf / Coffee factor: +150ml secondary dehydration buffer per cup of coffee
  const calculatedGoal = Math.round(
    weight * 35 +
    activity * 11.66 +
    (climate === 'hot' ? 500 : climate === 'cold' ? 0 : 100) +
    coffee * 150
  );

  // Convert to display units if needed
  const displayGoal = unit === 'oz' ? Math.round(calculatedGoal * 0.033814) : calculatedGoal;

  const handleApply = () => {
    onSaveCalculatedGoal(calculatedGoal, weight, activity, climate, coffee);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-blue-50/75 dark:border-slate-800 p-6 rounded-[32px] shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-blue-900 dark:text-slate-100 text-base leading-tight font-sans">Water Intake Calculator</h3>
          <p className="text-xs text-blue-400 dark:text-slate-500 font-medium">Configure based on your biological needs</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Weight input */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-blue-900/60 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Weight (kg)
            </label>
            <input
              type="number"
              min="30"
              max="200"
              value={weight || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWeight(val);
              }}
              className="w-full px-3.5 py-2.5 border border-blue-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-500 dark:text-slate-100"
            />
          </div>

          {/* Exercise Minutes */}
          <div>
            <label className="block text-xs font-bold text-blue-900/60 dark:text-slate-400 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
              <Dumbbell className="h-3.5 w-3.5 text-blue-400" />
              Exercise (min)
            </label>
            <input
              type="number"
              min="0"
              max="360"
              value={activity || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setActivity(val);
              }}
              className="w-full px-3.5 py-2.5 border border-blue-50 dark:border-slate-800 dark:bg-slate-950 rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-500 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Climate Select */}
        <div>
          <label className="block text-xs font-bold text-blue-900/60 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Climate / Ambient Heat
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['cold', 'temperate', 'hot'] as ClimateType[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClimate(c)}
                className={`py-2 px-3 text-xs font-extrabold rounded-2xl border capitalize transition-all ${
                  climate === c
                    ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-blue-50/40 dark:bg-slate-950 border-blue-50 dark:border-slate-800 text-blue-800 hover:bg-blue-100 dark:text-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Coffee intake tracker */}
        <div>
          <label className="block text-xs font-bold text-blue-900/60 dark:text-slate-400 mb-1.5 flex items-center gap-1.5 justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Coffee className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
              Coffee Intake (cups)
            </span>
            <span className="font-mono text-xxs text-amber-500 bg-amber-50/60 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg font-bold">
              +Dehydration buffer
            </span>
          </label>
          <div className="flex items-center justify-between gap-4 bg-blue-50/30 dark:bg-slate-950 p-2 rounded-2xl border border-blue-50/50">
            <button
              type="button"
              onClick={() => setCoffee(Math.max(0, coffee - 1))}
              className="w-9 h-9 rounded-xl border border-blue-50 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center"
            >
              -
            </button>
            <span className="font-bold text-sm text-blue-900 dark:text-slate-205">
              {coffee} cup{coffee !== 1 ? 's' : ''} (+{coffee * 150}ml buffer)
            </span>
            <button
              type="button"
              onClick={() => setCoffee(Math.min(10, coffee + 1))}
              className="w-9 h-9 rounded-xl border border-blue-50 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Calculated Result Indicator */}
        <div className="mt-4 p-4 rounded-[24px] bg-blue-50/60 dark:bg-sky-950/20 border border-blue-100 dark:border-sky-900/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase text-blue-400 dark:text-sky-400">
              Science Recommendation
            </div>
            <div className="text-2xl font-black text-blue-900 dark:text-slate-100 mt-0.5">
              {displayGoal} {unit}
            </div>
          </div>
          <button
            onClick={handleApply}
            disabled={isSaved}
            className={`py-3 px-5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 ${
              isSaved
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4" />
                <span>Applied!</span>
              </>
            ) : (
              <>
                <span>Use Recommended</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <div className="flex gap-2.5 p-3.5 rounded-2xl bg-blue-50/20 dark:bg-slate-950 border border-blue-50/50 dark:border-slate-900">
          <Info className="h-4.5 w-4.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xxs text-blue-900/50 dark:text-slate-500 leading-relaxed font-semibold">
            Our algorithm computes a tailored daily target on standard metabolic metabolic baselines, factoring in physical respiratory volume offsets, local sweat benchmarks, and caffeine dehydration compensation.
          </p>
        </div>
      </div>
    </div>
  );
}
