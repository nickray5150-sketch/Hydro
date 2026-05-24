import { useState, FormEvent } from 'react';
import { Calendar, Trash2, Plus, LogIn, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { HistoryRecord, WaterLog } from '../types';

interface CalendarLogProps {
  history: HistoryRecord[];
  onAddHistoricalLog: (date: string, amount: number, containerType: 'cup' | 'glass' | 'custom') => void;
  onDeleteHistoricalLog: (date: string, logId: string) => void;
  unit: 'ml' | 'oz';
}

export default function CalendarLog({
  history,
  onAddHistoricalLog,
  onDeleteHistoricalLog,
  unit,
}: CalendarLogProps) {
  // Let's obtain the last 7 dates formatted as YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [customAmount, setCustomAmount] = useState<number>(250);

  const getRecordForDate = (dateStr: string) => {
    return history.find((h) => h.date === dateStr);
  };

  const getDayLabel = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
  };

  // Generate lists of last 10 days
  const recentDays = Array.from({ length: 10 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const selectedRecord = getRecordForDate(selectedDate);
  const selectedLogs = selectedRecord?.logs || [];
  const selectedTarget = selectedRecord?.target || 2000;
  const loggedTotal = selectedLogs.reduce((acc, log) => acc + log.amount, 0);
  const percentage = Math.min(100, Math.round((loggedTotal / selectedTarget) * 100));

  const handleAddLog = (e: FormEvent) => {
    e.preventDefault();
    if (customAmount <= 0) return;
    onAddHistoricalLog(selectedDate, customAmount, 'custom');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-blue-50/75 dark:border-slate-800 p-6 rounded-[32px] shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-blue-900 dark:text-slate-100 text-base leading-tight font-sans">Water Log Calendar</h3>
          <p className="text-xs text-blue-400 dark:text-slate-500 font-medium">Review & retroactive water journal logs</p>
        </div>
      </div>

      {/* Slide of active days */}
      <div className="flex gap-2 pb-3 mb-5 border-b border-blue-50 dark:border-slate-950 overflow-x-auto scrollbar-hide">
        {recentDays.map((dateStr) => {
          const rec = getRecordForDate(dateStr);
          const recLogs = rec?.logs || [];
          const recTarget = rec?.target || 2000;
          const recLogged = recLogs.reduce((acc, log) => acc + log.amount, 0);
          const isSelected = selectedDate === dateStr;
          const isCompleted = recLogged >= recTarget;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center p-3 rounded-2xl border flex-shrink-0 min-w-[76px] transition-all relative ${
                isSelected
                  ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-blue-50/20 dark:bg-slate-950 border-blue-50 dark:border-slate-800 text-blue-900 dark:text-slate-400 hover:bg-blue-100'
              }`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-wide opacity-80 ${isSelected ? 'text-blue-100' : 'text-blue-400 dark:text-slate-505'}`}>
                {getDayLabel(dateStr).split(',')[0]}
              </span>
              <span className="text-sm font-black mt-1">
                {dateStr.split('-')[2]}
              </span>
              {/* Dot indicator matching total */}
              <div className="mt-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-white/25">
                {isCompleted ? (
                   <Check className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                ) : (
                  <span className={`text-[8px] font-mono font-black ${isSelected ? 'text-white' : 'text-blue-600'}`}>
                    {Math.round((recLogged / recTarget) * 100)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Day Summary & Logs list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-900/60 dark:text-slate-500 uppercase tracking-widest">
              {getDayLabel(selectedDate)} Status
            </h4>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
              {percentage}% of daily goal
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-blue-50/20 dark:bg-slate-950 border border-blue-50/50 dark:border-slate-900/60 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Hydration logged</p>
              <h5 className="text-xl font-black text-blue-900 dark:text-slate-100 mt-0.5">
                {loggedTotal} <span className="text-xs font-medium text-blue-300">/ {selectedTarget} ml</span>
              </h5>
            </div>
            <div className={`w-12 h-12 rounded-full border-4 ${percentage >= 100 ? 'border-emerald-250 text-emerald-500' : 'border-blue-200 text-blue-600'} dark:border-sky-900 flex items-center justify-center text-xs font-black font-mono`}>
              {percentage}%
            </div>
          </div>

          {/* List of individual logs for this date */}
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {selectedLogs.length === 0 ? (
              <p className="text-xs text-blue-400/55 dark:text-slate-500 text-center py-6 italic font-bold">
                No hydration records logged on this day.
              </p>
            ) : (
              selectedLogs.map((log) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-blue-50/60 dark:border-slate-800/80 hover:border-blue-100 transition-all text-xs"
                  >
                    <div>
                      <span className="font-bold text-blue-600 dark:text-slate-200 uppercase tracking-wider text-[10px] bg-blue-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl mr-2.5">
                        {log.containerType}
                      </span>
                      <span className="text-blue-300 font-bold font-sans">{timeStr}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-blue-900 dark:text-slate-100 font-mono">
                        {log.amount} ml
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteHistoricalLog(selectedDate, log.id)}
                        className="text-blue-300 hover:text-rose-500 p-1 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Retrospective water intake logger */}
        <div className="p-5 rounded-[24px] bg-blue-50/20 dark:bg-slate-950/40 border border-blue-50/50 dark:border-slate-900/60 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-blue-905 dark:text-slate-400 mb-2 uppercase tracking-wide">
              Log Water Retrospectively
            </h4>
            <p className="text-xxs text-blue-400 dark:text-slate-500 mb-4 leading-relaxed font-semibold font-sans">
              Missed a custom water portion yesterday? Select a date above, choose or enter your intake ml, and log backward seamlessly!
            </p>

            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-900/60 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                  Intake Dose (ml)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="10"
                    max="3000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-xs font-extrabold bg-white dark:bg-slate-950 border border-blue-50 dark:border-slate-800 rounded-2xl font-sans text-blue-950 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-1.5">
                    {[150, 250, 500].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setCustomAmount(quick)}
                        className={`px-3 py-2 text-xxs font-black rounded-xl border transition-all ${
                          customAmount === quick
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-slate-950 border-blue-50 dark:border-slate-800 text-blue-700 dark:text-slate-400 hover:bg-blue-50'
                        }`}
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1 active:scale-98"
              >
                <Plus className="h-4 w-4" />
                <span>Save to History Record</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
