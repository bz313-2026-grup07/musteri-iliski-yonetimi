/** Saniyeyi okunur süreye çevirir: 75 -> "1 dk 15 sn", 7380 -> "2 sa 3 dk" */
export function formatDuration(sec) {
  if (!sec) return '0 dk';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h} sa ${m} dk`;
  if (m) return `${m} dk${s ? ` ${s} sn` : ''}`;
  return `${s} sn`;
}

/** İstanbul saatine göre bugünün tarihi: "2026-11-23" */
export const todayIstanbul = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
