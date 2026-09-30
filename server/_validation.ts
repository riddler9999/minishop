export const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
export const positiveInt = (v: unknown, fallback: number, max = 100) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), max) : fallback;
};
