const componentToHex = (c: number) => {
  const hex = (c * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

export const rgbToHex = (rgb: [number, number, number]) => {
  return (
    "#" +
    componentToHex(rgb[0]) +
    componentToHex(rgb[1]) +
    componentToHex(rgb[2])
  );
};

export type ColorMap = [number, number, number];
//the default colors assigned to a loaded image
export const CHANNEL_COLOR_MAPS: Record<string, ColorMap> = {
  RED: [1, 0, 0],
  GREEN: [0, 1, 0],
  BLUE: [0, 0, 1],
  YELLOW: [1, 1, 0],
  CYAN: [0, 1, 1],
  MAGENTA: [1, 0, 1],
  WHITE: [1, 1, 1],
};
export const DEFAULT_COLORS: Array<ColorMap> = [
  CHANNEL_COLOR_MAPS.RED,
  CHANNEL_COLOR_MAPS.GREEN,
  CHANNEL_COLOR_MAPS.BLUE,
  CHANNEL_COLOR_MAPS.YELLOW,
  CHANNEL_COLOR_MAPS.CYAN,
  CHANNEL_COLOR_MAPS.MAGENTA,
  CHANNEL_COLOR_MAPS.WHITE,
];
