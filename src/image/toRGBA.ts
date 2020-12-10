export const toRGBA = (color: string, alpha: number) => {
  const parsed = parseInt(color, 16);

  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  const a = Math.round(alpha * 255);

  return [r, g, b, a];
};
