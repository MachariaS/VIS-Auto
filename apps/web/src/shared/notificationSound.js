let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(audioCtx, freq, startTime, duration, gain = 0.28) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.connect(env);
  env.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, startTime);
  env.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

export function playJobAlert() {
  try {
    const audioCtx = getCtx();
    const t = audioCtx.currentTime;
    // Rising two-note chime: G5 → B5
    tone(audioCtx, 784, t, 0.18);
    tone(audioCtx, 988, t + 0.14, 0.24);
  } catch {
    // Browser may block audio until user gesture — fail silently
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(title, body) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/assets/vis-auto-logo.png',
      badge: '/assets/vis-auto-logo.png',
      tag: 'vis-job-alert',
      renotify: true,
    });
    setTimeout(() => n.close(), 6000);
  } catch { /* non-fatal */ }
}
