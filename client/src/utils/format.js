import { TIMEZONE } from '../constants';

export function formatDuration(totalSeconds) {
  if (!totalSeconds) return '0 dk';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours} sa ${minutes} dk`;
  if (minutes) return seconds ? `${minutes} dk ${seconds} sn` : `${minutes} dk`;
  return `${seconds} sn`;
}

// sv-SE yereli tarihi doğrudan YYYY-MM-DD biçiminde verir.
export const todayIstanbul = () => new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE });

export const currentHourIstanbul = () => Number(
  new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: TIMEZONE }),
);

export const formatTime = (value) => new Date(value).toLocaleTimeString('tr-TR', {
  hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
});

export function formatLongDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', weekday: 'long',
  });
}
