import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  Settings, 
  Bell, 
  Flame, 
  ChevronRight, 
  LogOut, 
  Undo,
  Info,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Volume2
} from 'lucide-react';

import { WaterLog, HistoryRecord, UserSettings, InAppNotification, ClimateType } from './types';
import WaveVisualizer from './components/WaveVisualizer';
import GoalCalculator from './components/GoalCalculator';
import NotificationSettings from './components/NotificationSettings';
import CalendarLog from './components/CalendarLog';
import AnalyticsCharts from './components/AnalyticsCharts';
import QuickAddPanel from './components/QuickAddPanel';

import { playDropChime, playMilestoneChime, playReminderNudge } from './utils/audio';

// Helper to format Date target
const getTodayDateStr = () => {
  return new Date().toISOString().split('T')[0];
};

// Seed sample historical data for last 7 days to make the analytics immediately populated and visually gorgeous
const getSeedHistory = (defaultTarget: number): HistoryRecord[] => {
  const seed: HistoryRecord[] = [];
  const today = new Date();
  
  // Percentage profiles for last 7 days to look realistic
  const percentProfiles = [0.85, 1.05, 0.60, 1.10, 0.90, 1.00, 0.40]; // older to recent

  for (let i = 7; i >= 1; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const target = defaultTarget;
    const profilePercent = percentProfiles[7 - i] || 0.8;
    const dayLogged = Math.round(target * profilePercent);

    // Create a couple of individual logs
    const logs: WaterLog[] = [];
    if (dayLogged > 0) {
      const half = Math.round(dayLogged / 2);
      logs.push({
        id: `seed-1-${dateStr}`,
        amount: half,
        timestamp: `${dateStr}T10:15:30.000Z`,
        containerType: 'glass',
      });
      logs.push({
        id: `seed-2-${dateStr}`,
        amount: dayLogged - half,
        timestamp: `${dateStr}T15:42:00.000Z`,
        containerType: 'bottle',
      });
    }

    seed.push({
      date: dateStr,
      target,
      logs,
    });
  }

  return seed;
};

const DEFAULT_SETTINGS: UserSettings = {
  dailyTargetMl: 2500,
  reminderIntervalMinutes: 60,
  remindersEnabled: true,
  reminderSoundEnabled: true,
  reminderStartTime: '08:00',
  reminderEndTime: '22:00',
  unit: 'ml',
  weightKg: 72,
  activityMinutes: 45,
  climate: 'temperate',
  coffeeCups: 1,
  isWorkoutDay: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'history' | 'analytics' | 'settings'>('tracker');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<InAppNotification | null>(null);
  const lastActiveCheckRef = useRef<number>(Date.now());

  // 1. Load data from local storage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('hydro_settings_v1');
    const storedHistory = localStorage.getItem('hydro_history_v1');
    const storedNotifications = localStorage.getItem('hydro_notifications_v1');

    let finalSettings = DEFAULT_SETTINGS;
    if (storedSettings) {
      try {
        finalSettings = JSON.parse(storedSettings);
        setSettings(finalSettings);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }

    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    } else {
      // Seed initial dummy days to make analytics charts look beautiful immediately
      const seeded = getSeedHistory(finalSettings.dailyTargetMl);
      setHistory(seeded);
      localStorage.setItem('hydro_history_v1', JSON.stringify(seeded));
    }

    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    } else {
      // Initial reminder center greetings
      const greetingAlert: InAppNotification = {
        id: 'greet_init',
        title: 'Welcome to Daily Water Tracker! 💧',
        message: 'Your personalized scientific goals have been set up based on metabolic baselines. Keep logging to stay fueled!',
        timestamp: new Date().toISOString(),
        type: 'achievement',
        read: false,
      };
      setNotifications([greetingAlert]);
      localStorage.setItem('hydro_notifications_v1', JSON.stringify([greetingAlert]));
    }
  }, []);

  // Sync state to local storage when history updates
  const saveHistoryToStorage = (newHistory: HistoryRecord[]) => {
    setHistory(newHistory);
    localStorage.setItem('hydro_history_v1', JSON.stringify(newHistory));
  };

  // Sync settings helper
  const saveSettingsToStorage = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('hydro_settings_v1', JSON.stringify(newSettings));
  };

  // Sync notifications helper
  const saveNotificationsToStorage = (newNotifs: InAppNotification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem('hydro_notifications_v1', JSON.stringify(newNotifs));
  };

  // Compute today's total metrics
  const todayRecord = useMemo(() => {
    const todayStr = getTodayDateStr();
    let record = history.find((h) => h.date === todayStr);
    if (!record) {
      // Create lazy today's empty record with target default
      record = {
        date: todayStr,
        target: settings.dailyTargetMl,
        logs: [],
      };
    }
    return record;
  }, [history, settings.dailyTargetMl]);

  const todayAmount = useMemo(() => {
    return todayRecord.logs.reduce((sum, item) => sum + item.amount, 0);
  }, [todayRecord]);

  // Compute sequential daily streaks
  const hydrationStreak = useMemo(() => {
    let streak = 0;
    const sortedRecordDates = [...history]
      .filter((h) => h.date !== getTodayDateStr()) // calculate streaks for completed prior days
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Check if yesterday or prior days were successfully completed
    let checkDate = new Date();
    // Start with yesterday
    checkDate.setDate(checkDate.getDate() - 1);

    for (let i = 0; i < 30; i++) { // constraint to max 30 days lookback
      const dateStr = checkDate.toISOString().split('T')[0];
      const record = history.find((h) => h.date === dateStr);
      
      if (record) {
        const amount = record.logs.reduce((sum, item) => sum + item.amount, 0);
        if (amount >= record.target) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break; // broke streak
        }
      } else {
        break; // missing records
      }
    }

    // Add today if today's target is already completed
    if (todayAmount >= settings.dailyTargetMl) {
      streak++;
    }

    return streak === 0 ? 1 : streak; // default is a 1-day starting baseline
  }, [history, todayAmount, settings.dailyTargetMl]);

  // Handle triggered notifications & inline alerts
  const triggerNotification = (title: string, message: string, type: 'reminder' | 'milestone' | 'achievement') => {
    const newNotif: InAppNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
    };
    
    // Set Toast on screen
    setActiveToast(newNotif);
    
    // Add to list
    const updated = [newNotif, ...notifications].slice(0, 50); // limit to last 50
    saveNotificationsToStorage(updated);

    // Auto dismiss Toast in 8 seconds
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 8000);
  };

  // active notification daemon to simulate background interval nudges
  useEffect(() => {
    if (!settings.remindersEnabled) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHourStr = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"

      // Check active reminder hour limits
      if (currentHourStr < settings.reminderStartTime || currentHourStr > settings.reminderEndTime) {
        return;
      }

      // Check minutes since last drink log or last alert
      const sortedLogs = [...todayRecord.logs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const lastDrinkTime = sortedLogs[0] ? new Date(sortedLogs[0].timestamp).getTime() : 0;
      const msSinceLastDrink = Date.now() - lastDrinkTime;
      const intervalMs = settings.reminderIntervalMinutes * 60 * 1000;

      // Ensure we haven't already nudged in other ways recently
      const msSinceLastCheck = Date.now() - lastActiveCheckRef.current;

      if (lastDrinkTime > 0 && msSinceLastDrink >= intervalMs && msSinceLastCheck >= 60000) {
        // Trigger smart proactive water reminder
        if (settings.reminderSoundEnabled) {
          playReminderNudge();
        }
        triggerNotification(
          'Hydration Nudge! 💧',
          `It has been over ${settings.reminderIntervalMinutes} minutes since your last sip. Take 250ml now to maintain high metabolism.`,
          'reminder'
        );
        lastActiveCheckRef.current = Date.now();
      }
    }, 15000); // check status every 15s

    return () => clearInterval(intervalId);
  }, [settings, todayRecord, notifications]);

  // Main intake logging pipeline
  const logWaterAmount = (amount: number, containerType: 'cup' | 'glass' | 'bottle' | 'flask' | 'custom') => {
    const todayStr = getTodayDateStr();
    
    // Play sound drop
    if (settings.reminderSoundEnabled) {
      playDropChime();
    }

    const newLog: WaterLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      amount,
      timestamp: new Date().toISOString(),
      containerType,
    };

    // Update today's entry
    let dateRecordExists = false;
    const updatedHistory = history.map((record) => {
      if (record.date === todayStr) {
        dateRecordExists = true;
        return {
          ...record,
          logs: [...record.logs, newLog],
        };
      }
      return record;
    });

    let finalHistory = updatedHistory;
    if (!dateRecordExists) {
      finalHistory = [
        ...history,
        {
          date: todayStr,
          target: settings.dailyTargetMl,
          logs: [newLog],
        },
      ];
    }

    saveHistoryToStorage(finalHistory);

    // Calculate goals thresholds & trigger fun rewards
    const previousTotal = todayAmount;
    const currentTotal = previousTotal + amount;
    const target = settings.dailyTargetMl;

    const prevPercent = (previousTotal / target) * 100;
    const currPercent = (currentTotal / target) * 100;

    // Milestone thresholds celebrating checkpoints
    if (prevPercent < 50 && currPercent >= 50) {
      if (settings.reminderSoundEnabled) playMilestoneChime();
      triggerNotification('Halfway Milestone Reached! 🌟', 'You have logged over 50% of your daily hydration. You are focused and energized!', 'milestone');
    } else if (prevPercent < 75 && currPercent >= 75) {
      if (settings.reminderSoundEnabled) playMilestoneChime();
      triggerNotification('Almost There! ⚡', '75% complete. Your cognitive functions and muscles are performing optimally!', 'milestone');
    } else if (prevPercent < 100 && currPercent >= 100) {
      if (settings.reminderSoundEnabled) playMilestoneChime();
      triggerNotification('Daily Hydro Goal Completed! 🏆', 'Sensational! You hit your 100% target today. Keep this fantastic streak burning!', 'achievement');
    }
  };

  // Undo last log entry for current day
  const handleUndoToday = () => {
    const todayStr = getTodayDateStr();
    const todayRec = history.find((h) => h.date === todayStr);
    if (!todayRec || todayRec.logs.length === 0) return;

    const lastLog = todayRec.logs[todayRec.logs.length - 1];
    const updatedLogs = todayRec.logs.slice(0, -1);

    const updatedHistory = history.map((record) => {
      if (record.date === todayStr) {
        return { ...record, logs: updatedLogs };
      }
      return record;
    });

    saveHistoryToStorage(updatedHistory);
    triggerNotification('Entry Revoked', `Removed ${lastLog.amount}ml of water log.`, 'reminder');
  };

  // Retrospective actions from calendar calendar
  const handleAddHistoricalLog = (date: string, amount: number, containerType: 'cup' | 'glass' | 'custom') => {
    let dateRecordExists = false;
    const newLog: WaterLog = {
      id: `hist_log_${Date.now()}`,
      amount,
      timestamp: `${date}T12:00:00.000Z`,
      containerType,
    };

    const updatedHistory = history.map((record) => {
      if (record.date === date) {
        dateRecordExists = true;
        return {
          ...record,
          logs: [...record.logs, newLog],
        };
      }
      return record;
    });

    let finalHistory = updatedHistory;
    if (!dateRecordExists) {
      finalHistory = [
        ...history,
        {
          date,
          target: settings.dailyTargetMl,
          logs: [newLog],
        },
      ];
    }
    saveHistoryToStorage(finalHistory);
    
    if (settings.reminderSoundEnabled) {
      playDropChime();
    }
    triggerNotification('Historical Log Entered', `Logged ${amount}ml for ${date} target successfully.`, 'reminder');
  };

  const handleDeleteHistoricalLog = (date: string, logId: string) => {
    const updatedHistory = history.map((record) => {
      if (record.date === date) {
        return {
          ...record,
          logs: record.logs.filter((l) => l.id !== logId),
        };
      }
      return record;
    });
    saveHistoryToStorage(updatedHistory);
    triggerNotification('Record Removed', 'Water entry cleared from selected date records.', 'reminder');
  };

  // Trigger test alerts from reminder dashboard
  const handleTriggerTestAlarm = () => {
    triggerNotification(
      'Healthy Nudge (Test) 💧',
      'This is a visual reminder! Consistently taking water will prevent micro-fatigue.',
      'reminder'
    );
  };

  const handleUpdateSettings = (partial: Partial<UserSettings>) => {
    const nextSettings = { ...settings, ...partial };
    saveSettingsToStorage(nextSettings);
    
    // If goal targets changed, update today's target as well
    if (partial.dailyTargetMl !== undefined) {
      const todayStr = getTodayDateStr();
      const updatedHistory = history.map((rec) => {
        if (rec.date === todayStr) {
          return { ...rec, target: partial.dailyTargetMl! };
        }
        return rec;
      });
      saveHistoryToStorage(updatedHistory);
    }
  };

  const handleSaveCalculatedGoal = (computedTarget: number, weight: number, activity: number, climate: ClimateType, coffee: number) => {
    const updated: UserSettings = {
      ...settings,
      dailyTargetMl: computedTarget,
      weightKg: weight,
      activityMinutes: activity,
      climate: climate,
      coffeeCups: coffee,
    };
    saveSettingsToStorage(updated);
    
    // Cascade to active today target
    const todayStr = getTodayDateStr();
    const updatedHistory = history.map((rec) => {
      if (rec.date === todayStr) {
        return { ...rec, target: computedTarget };
      }
      return rec;
    });
    saveHistoryToStorage(updatedHistory);
    triggerNotification('Target Synchronized!', `Goal set to recommended ${computedTarget} ml successfully based on active diagnostics.`, 'achievement');
  };

  const clearNotificationsCenter = () => {
    saveNotificationsToStorage([]);
  };

  return (
    <div id="app-root" className="min-h-screen bg-transparent text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans relative pb-10">
      
      {/* Dynamic Slide-in Top Alert Notification Panel */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-850 p-4 rounded-3xl shadow-2xl z-50 flex gap-3.5"
          >
            <div className={`p-2.5 rounded-2xl flex-shrink-0 flex items-center justify-center ${
              activeToast.type === 'milestone' 
                ? 'bg-amber-100 text-amber-600' 
                : activeToast.type === 'achievement' 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              {activeToast.type === 'milestone' ? (
                <Sparkles className="h-5 w-5" />
              ) : activeToast.type === 'achievement' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-xs text-blue-900 dark:text-slate-100 leading-snug">
                {activeToast.title}
              </h4>
              <p className="text-xxs text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">
                {activeToast.message}
              </p>
              
              <div className="flex justify-end gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => logWaterAmount(250, 'glass')}
                  className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-[10px] px-3.5 py-1.5 rounded-xl font-black transition-all"
                >
                  Drink 250ml
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="text-slate-400 hover:text-slate-600 text-[10px] px-2 py-1 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout Header */}
      <header className="border-b border-blue-100/60 dark:border-slate-900 bg-white/80 dark:bg-slate-950/75 backdrop-blur-md sticky top-0 z-45">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-500 rounded-[18px] text-white shadow-md shadow-blue-500/20 flex items-center justify-center">
              <Droplet className="h-5 w-5 fill-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-blue-900 dark:text-slate-100 font-display">
                HydroTrack
              </h1>
              <p className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">
                Interactive Hydration Tracker
              </p>
            </div>
          </div>

          {/* Quick Stats on Top Bar */}
          <div className="hidden sm:flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-blue-50 dark:border-slate-800 shadow-sm shadow-blue-100/30">
              <Flame className="h-4.5 w-4.5 text-blue-500 fill-blue-200" />
              <div className="text-left">
                <div className="text-[9px] font-bold text-blue-400 uppercase leading-none">Streak</div>
                <div className="text-xs font-black text-blue-900 dark:text-slate-200 leading-tight mt-0.5">
                  {hydrationStreak} Days
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-blue-50 dark:border-slate-800 shadow-sm shadow-blue-100/30">
              <Volume2 className="h-4.5 w-4.5 text-blue-500" />
              <div className="text-left">
                <div className="text-[9px] font-bold text-blue-400 uppercase leading-none">Sound Chime</div>
                <div className="text-xs font-black text-blue-900 dark:text-slate-200 leading-tight mt-0.5">
                  {settings.reminderSoundEnabled ? 'Active' : 'Muted'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Panel Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        
        {/* Navigation Ribbon Selector */}
        <div className="flex border-b border-blue-100 dark:border-slate-850 gap-6 mb-6">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`pb-3 font-extrabold text-xs tracking-wider uppercase border-b-3 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tracker'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-black'
                : 'border-transparent text-blue-400/70 hover:text-blue-600 dark:text-slate-500'
            }`}
          >
            Logging & Cup
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 font-extrabold text-xs tracking-wider uppercase border-b-3 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-black'
                : 'border-transparent text-blue-400/70 hover:text-blue-600 dark:text-slate-500'
            }`}
          >
            Insights & Analytics
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-extrabold text-xs tracking-wider uppercase border-b-3 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-black'
                : 'border-transparent text-blue-400/70 hover:text-blue-600 dark:text-slate-500'
            }`}
          >
            Journal Calendar
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 font-extrabold text-xs tracking-wider uppercase border-b-3 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-black'
                : 'border-transparent text-blue-400/70 hover:text-blue-600 dark:text-slate-500'
            }`}
          >
            Goal & Reminders
          </button>
        </div>

        {/* Dynamic Display Panels in Tabbed Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* TRACKER VIEW */}
          {activeTab === 'tracker' && (
            <>
              {/* Left Column: Interactive Interactive Wave Visualizer Cup */}
              <div className="lg:col-span-4 h-full">
                <WaveVisualizer
                  currentAmount={todayAmount}
                  targetAmount={settings.dailyTargetMl}
                  onQuickAdd={logWaterAmount}
                  streak={hydrationStreak}
                />
              </div>

              {/* Right Column: Containers Grid Logging Panel & Undo */}
              <div className="lg:col-span-8 space-y-6">
                <QuickAddPanel onAddWater={logWaterAmount} unit={settings.unit} />

                {/* Today's logged history micro logs list */}
                <div className="bg-white dark:bg-slate-900 border border-blue-100/60 dark:border-slate-800 p-6 rounded-[32px] shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-black text-blue-900 dark:text-slate-100 text-sm">Today's Drinking Logs</h3>
                      <p className="text-xxs text-blue-400 dark:text-slate-500 font-medium font-sans">Overview of fluid intakes registered for today</p>
                    </div>
                    {todayRecord.logs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUndoToday}
                        className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50/60 dark:bg-sky-950/30 font-extrabold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Undo className="h-3.5 w-3.5" />
                        <span>Undo Last Log</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {todayRecord.logs.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-blue-100/60 dark:border-slate-800 rounded-2xl">
                        <Droplet className="h-8 w-8 text-blue-300 mx-auto animate-bounce mb-2" />
                        <p className="text-xs text-blue-400 dark:text-slate-500 italic font-semibold">No hydration logs registered today yet. Start drinking!</p>
                      </div>
                    ) : (
                      [...todayRecord.logs].reverse().map((log) => {
                        const time = new Date(log.timestamp).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <div
                            key={log.id}
                            className="bg-blue-50/20 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-blue-50/50 dark:border-slate-900 flex items-center justify-between transition-all hover:scale-[1.002]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase py-0.5 px-2 bg-white dark:bg-slate-900 border border-blue-100/50 dark:border-slate-800/80 rounded shadow-sm text-blue-600 dark:text-blue-400 font-mono">
                                {log.containerType}
                              </span>
                              <span className="text-xs text-blue-900/40 dark:text-slate-400 font-semibold font-sans">Logged at {time}</span>
                            </div>
                            <span className="text-xs font-black text-blue-900 dark:text-slate-100 font-mono">
                              +{log.amount} ml
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ANALYTICS VIEW */}
          {activeTab === 'analytics' && (
            <div className="lg:col-span-12 gap-6 grid grid-cols-1 md:grid-cols-2">
              <AnalyticsCharts history={history} unit={settings.unit} />
              
              {/* Informative scientific water tracking guidelines */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm mb-2 flex items-center gap-1.5">
                    <Info className="h-4.5 w-4.5 text-sky-500 fill-sky-100" />
                    Hydration Health Advisor
                  </h3>
                  <p className="text-xxs text-slate-400 dark:text-slate-500 mb-4 leading-normal">
                    Fulfilled targets generate robust circulatory rates, optimized brain oxygen level, and dynamic cellular detoxification. Here are recommended checkpoints:
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 bg-sky-50/50 dark:bg-sky-950/20 rounded-2xl flex gap-3 border border-sky-100/30">
                      <div className="text-sky-500 text-xs font-extrabold flex-shrink-0">🚀</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">The 30-Min Post-Wake Rule</h4>
                        <p className="text-xxs text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                          Drink 300ml right after waking to kickstart liver filters and correct overnight dehydration instantly.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl flex gap-3 border border-emerald-110/30">
                      <div className="text-emerald-500 text-xs font-extrabold flex-shrink-0">☕</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Avoid the Coffee Depletion Check</h4>
                        <p className="text-xxs text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                          For every cup of coffee, your body filters out approximately 1.5x of the volume in fluids. Balance this out with a quick 150ml follow-up glass of water!
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl flex gap-3 border border-indigo-110/30">
                      <div className="text-indigo-500 text-xs font-extrabold flex-shrink-0">🌙</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Pre-Sleep Tapering</h4>
                        <p className="text-xxs text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                          Reduce drinking quantities relative to target baseline after 8:00 PM (or 2 hours before target sleep time) to protect sleep continuity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 p-3.5 bg-amber-500/10 border border-amber-300/30 text-amber-600 dark:text-amber-400 rounded-xl text-xxs font-medium leading-normal flex items-start gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                  <span>
                    <strong>Caution:</strong> Hydration thresholds depend on medical baselines. Consult a sports advisor or clinical professional if you suffer from cardiorespiratory or renal issues.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY JOURNAL VIEW */}
          {activeTab === 'history' && (
            <div className="lg:col-span-12">
              <CalendarLog
                history={history}
                onAddHistoricalLog={handleAddHistoricalLog}
                onDeleteHistoricalLog={handleDeleteHistoricalLog}
                unit={settings.unit}
              />
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Notification preferences and frequencies */}
              <NotificationSettings
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onTriggerTestAlarm={handleTriggerTestAlarm}
              />

              {/* Goal Calculator */}
              <GoalCalculator
                currentWeight={settings.weightKg}
                currentActivity={settings.activityMinutes}
                currentClimate={settings.climate}
                currentCoffee={settings.coffeeCups}
                onSaveCalculatedGoal={handleSaveCalculatedGoal}
                unit={settings.unit}
              />

              {/* Manual Hydration Target modification panel */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-150 text-sm mb-1">Set Manual Target</h3>
                  <p className="text-xxs text-slate-400 dark:text-slate-500 mb-4">Overwrite calculated targets if you have custom doctor recommendations</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                        Preferred Daily Unit
                      </label>
                      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-900">
                        <button
                          type="button"
                          onClick={() => handleUpdateSettings({ unit: 'ml' })}
                          className={`flex-1 py-1 px-3 text-xs font-semibold rounded-lg text-center transition-all ${
                            settings.unit === 'ml'
                              ? 'bg-sky-500 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          milliliters (ml)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSettings({ unit: 'oz' })}
                          className={`flex-1 py-1 px-3 text-xs font-semibold rounded-lg text-center transition-all ${
                            settings.unit === 'oz'
                              ? 'bg-sky-500 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                           fluid ounces (oz)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                        Target Intake ({settings.unit})
                      </label>
                      <div className="flex gap-2.5">
                        <input
                          type="number"
                          min="500"
                          max="8000"
                          step="100"
                          value={settings.unit === 'oz' ? Math.round(settings.dailyTargetMl * 0.033814) : settings.dailyTargetMl}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updatedMl = settings.unit === 'oz' ? Math.round(val / 0.033814) : val;
                            handleUpdateSettings({ dailyTargetMl: updatedMl });
                          }}
                          className="flex-1 px-3.5 py-2 border border-slate-100 dark:border-slate-800 dark:bg-slate-950 rounded-xl text-xs font-sans text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                        />
                        <span className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 border-none rounded-xl text-xxs font-mono font-bold text-sky-500">
                          {settings.unit === 'oz' ? `${settings.dailyTargetMl} ml` : `${Math.round(settings.dailyTargetMl * 0.033814)} oz`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications Center logs view */}
                <div className="flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Bell className="h-3 w-3 text-sky-500" /> Notifications Logs
                      </span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={clearNotificationsCenter}
                          className="text-[9px] font-bold text-rose-500 hover:text-rose-600 uppercase"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-6 italic">No notifications generated yet.</p>
                      ) : (
                        notifications.map((notif) => {
                          const date = new Date(notif.timestamp).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          });
                          return (
                            <div key={notif.id} className="text-[10px] bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-100/60 dark:border-slate-900">
                              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                                <span>{notif.title}</span>
                                <span className="font-mono text-[9px] text-slate-400 font-medium">{date}</span>
                              </div>
                              <p className="text-slate-400 mt-0.5 leading-normal">{notif.message}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="text-center mt-12 select-none border-t border-slate-100/40 dark:border-slate-900/40 pt-6">
        <p className="text-xxs text-slate-400/80 dark:text-slate-500">
          HydroTrack — Clinically Tailored Hydration Companion. All logs stored locally on device.
        </p>
      </footer>
    </div>
  );
}
