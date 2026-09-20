export function ks(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} Ks`;
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
