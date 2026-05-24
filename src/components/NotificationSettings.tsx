import { Bell, BellOff, Volume2, VolumeX, Sparkles, Clock } from 'lucide-react';
import { UserSettings } from '../types';
import { playReminderNudge } from '../utils/audio';

interface NotificationSettingsProps {
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onTriggerTestAlarm: () => void;
}

export default function NotificationSettings({
  settings,
  onUpdateSettings,
  onTriggerTestAlarm,
}: NotificationSettingsProps) {

  const intervals = [15, 30, 45, 60, 90, 120, 180];

  const handleTestChime = () => {
    if (settings.reminderSoundEnabled) {
      playReminderNudge();
    }
    onTriggerTestAlarm();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-blue-50/75 dark:border-slate-800 p-6 rounded-[32px] shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-blue-900 dark:text-slate-100 text-base leading-tight font-sans">Water Reminders</h3>
          <p className="text-xs text-blue-400 dark:text-slate-500 font-medium">Auto-nudge system to prevent dehydration</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Toggle Reminders & Sound */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onUpdateSettings({ remindersEnabled: !settings.remindersEnabled })}
            className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between h-24 ${
              settings.remindersEnabled
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-blue-50/40 dark:bg-slate-950/50 border-blue-50 dark:border-slate-900 text-blue-950'
            }`}
          >
            <div className="flex justify-between w-full items-center">
              {settings.remindersEnabled ? (
                <Bell className="h-5 w-5 text-white" />
              ) : (
                <BellOff className="h-5 w-5 text-blue-400" />
              )}
              <span className={`w-2.5 h-2.5 rounded-full ${settings.remindersEnabled ? 'bg-white animate-ping' : 'bg-blue-200 dark:bg-slate-700'}`}></span>
            </div>
            <div>
              <div className="text-xs font-black leading-none uppercase tracking-wider mb-1">Notifications</div>
              <span className="text-[10px] opacity-90 font-bold">{settings.remindersEnabled ? 'Active daemon' : 'Muted'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ reminderSoundEnabled: !settings.reminderSoundEnabled })}
            className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between h-24 ${
              settings.reminderSoundEnabled
                ? 'bg-blue-900 border-blue-900 text-white shadow-lg shadow-blue-900/10'
                : 'bg-blue-50/40 dark:bg-slate-950/50 border-blue-50 dark:border-slate-900 text-blue-950'
            }`}
          >
            <div className="flex justify-between w-full items-center">
              {settings.reminderSoundEnabled ? (
                <Volume2 className="h-5 w-5 text-white" />
              ) : (
                <VolumeX className="h-5 w-5 text-blue-400" />
              )}
              <span className={`w-2.5 h-2.5 rounded-full ${settings.reminderSoundEnabled ? 'bg-white animate-pulse' : 'bg-blue-200 dark:bg-slate-700'}`}></span>
            </div>
            <div>
              <div className="text-xs font-black leading-none uppercase tracking-wider mb-1">Sound Chime</div>
              <span className="text-[10px] opacity-90 font-bold">{settings.reminderSoundEnabled ? 'Audio alerts' : 'Silent run'}</span>
            </div>
          </button>
        </div>

        {/* Set Reminder Interval */}
        {settings.remindersEnabled && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-blue-900/60 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Nudge Interval Frequency
              </label>
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-hide">
                {intervals.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onUpdateSettings({ reminderIntervalMinutes: mins })}
                    className={`py-2 px-3.5 text-xs font-extrabold rounded-2xl border flex-shrink-0 transition-all ${
                      settings.reminderIntervalMinutes === mins
                        ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-blue-50/50 dark:bg-slate-950 border-blue-50 dark:border-slate-800 hover:bg-blue-100 dark:hover:bg-slate-900 text-blue-900 dark:text-slate-400'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Hours Schedule */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-3xl bg-blue-50/30 dark:bg-slate-950 border border-blue-50/50 dark:border-slate-900">
              <div>
                <label className="block text-[10px] font-bold text-blue-900/50 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" /> Start Hour
                </label>
                <input
                  type="time"
                  value={settings.reminderStartTime}
                  onChange={(e) => onUpdateSettings({ reminderStartTime: e.target.value })}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-blue-50 dark:border-slate-800 p-2 rounded-xl text-blue-900 dark:text-slate-300 font-sans cursor-pointer focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-900/50 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" /> End Hour
                </label>
                <input
                  type="time"
                  value={settings.reminderEndTime}
                  onChange={(e) => onUpdateSettings({ reminderEndTime: e.target.value })}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-blue-50 dark:border-slate-800 p-2 rounded-xl text-blue-900 dark:text-slate-300 font-sans cursor-pointer focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Trigger Test Button */}
        <div>
          <button
            type="button"
            onClick={handleTestChime}
            className="w-full py-4 px-6 rounded-3xl border border-dashed border-blue-300 dark:border-sky-800/60 bg-blue-50/40 hover:bg-blue-100/50 dark:hover:bg-sky-950/20 font-black text-xs text-blue-700 dark:text-sky-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 animate-pulse text-blue-500" />
            <span>Simulate Live Water Reminder</span>
          </button>
        </div>
      </div>
    </div>
  );
}
