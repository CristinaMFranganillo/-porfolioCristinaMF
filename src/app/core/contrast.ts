/** Utilidades WCAG 2.x de contraste a partir de colores hex. */
export function luminance(hex: string): number {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(n.substring(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function wcagLevel(ratio: number): string {
  return ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'AA grande';
}

export const formatRatio = (r: number) => `${r.toFixed(1).replace('.', ',')} : 1`;
