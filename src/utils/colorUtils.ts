import { BitDepth } from "store/data/types";
import { getRandomInt } from "./dataUtils";

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

export const getRandomHex = () => {
  const hexArr = Array.from({ length: 3 }, () =>
    getRandomInt(0, 255).toString(16),
  );
  return "#" + hexArr.join("");
};
export const getRestrictedRandomHex = (restrictions: string[]) => {
  let hex: string;
  do {
    hex = getRandomHex();
  } while (restrictions.includes(hex));
  return hex;
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

export const createLUT = (params: {
  bitDepth: BitDepth;
  colorMap: ColorMap;
  min?: number;
  max?: number;
}): number[][] => {
  const { bitDepth, colorMap, min, max } = params;
  const maxIntensity = 2 ** bitDepth - 1;
  const scaledMin = min ? min : 0;
  const scaledMax = max ? max : maxIntensity;

  const range = scaledMax - scaledMin;

  const lut = colorMap.map((w) =>
    Array.from({ length: maxIntensity + 1 }, (_, v) => {
      const leveled = Math.max(
        0,
        Math.min(maxIntensity, ((v - scaledMin) / range) * maxIntensity),
      );
      return Math.min(255, Math.round((leveled / maxIntensity) * 255 * w));
    }),
  );
  return lut;
};
