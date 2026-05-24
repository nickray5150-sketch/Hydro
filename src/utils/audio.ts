/**
 * Native AudioContext chime generator for elegant, lightweight, 
 * customizable water drop and chime sounds.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Unlock suspended context (Chrome/Safari autoplay restrictions)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a refreshing "water drop" bubble sound
 */
export function playDropChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First bubble (low-to-high swoop)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    // Rapid frequency swoop for "bloop" effect
    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second chime (glass/water resonance)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1600, now + 0.08);

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.6);

  } catch (err) {
    console.warn('Audio Context is not supported or was blocked by the browser', err);
  }
}

/**
 * Plays a gentle, ambient "achievement/milestone" chime
 */
export function playMilestoneChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Sweet major triad arpeggio (C major: C -> E -> G -> C)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const delays = [0, 0.08, 0.16, 0.24];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gain.gain.setValueAtTime(0, now + delays[i]);
      gain.gain.linearRampToValueAtTime(0.1, now + delays[i] + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delays[i] + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 1.3);
    });

  } catch (err) {
    console.warn('Audio Context is not supported or was blocked by the browser', err);
  }
}

/**
 * Plays a subtle nudge chime for reminders
 */
export function playReminderNudge() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Clean dual-frequency chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now); // E6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.82);
    osc2.stop(now + 0.82);

  } catch (err) {
    console.warn('Audio Context was blocked or unsupported', err);
  }
}
