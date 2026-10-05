const AMMAN_TIME_ZONE = 'Asia/Amman';

export function ammanDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid activity time');
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: AMMAN_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

const dayNumber = key => {
  const [year, month, day] = key.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
};

export function nextQuranActivityStreak(profile = {}, activityTime = new Date()) {
  const today = ammanDateKey(activityTime);
  const previousDate = String(profile.lastQuranActivityDate || '');
  const previousStreak = Math.max(0, Number(profile.streak) || 0);
  if (previousDate === today) return { streak: previousStreak, lastQuranActivityDate: today, changed: false };
  const consecutive = /^\d{4}-\d{2}-\d{2}$/.test(previousDate) && dayNumber(today) - dayNumber(previousDate) === 1;
  return { streak: consecutive ? previousStreak + 1 : 1, lastQuranActivityDate: today, changed: true };
}

export function activityNow() {
  if (process.env.NODE_ENV === 'test' && process.env.MA7FATH_EMULATOR_TEST === '1' && process.env.MA7FATH_TEST_NOW) {
    return new Date(process.env.MA7FATH_TEST_NOW);
  }
  return new Date();
}

export { AMMAN_TIME_ZONE };
