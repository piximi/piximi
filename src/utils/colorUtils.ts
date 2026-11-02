import { getRandomInt } from "./dataUtils";

import type { BitDepth } from "core/entities";

const componentToHex = (c: number) => {
  c = c > 1 ? c : c * 255;
  const hex = c.toString(16).padStart(2, "0");
  return hex;
};

export const rgbToHex = (rgb: [number, number, number]) => {
  return `#${
    componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2])
  }`;
};

export const hexToRGB = (hex: string, scale: boolean, alpha?: number) => {
  let cleanHex = hex.replace(/^#/, "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const a = alpha
    ? alpha
    : cleanHex.length === 8
      ? parseInt(cleanHex.slice(6, 8), 16)
      : undefined;

  const scaleFactor = scale ? 255 : 1;

  // 2. Convert Hex to RGB fractions (0 to 1)
  const r = parseInt(cleanHex.substring(0, 2), 16) / scaleFactor;
  const g = parseInt(cleanHex.substring(2, 4), 16) / scaleFactor;
  const b = parseInt(cleanHex.substring(4, 6), 16) / scaleFactor;
  return a ? [r, g, b, a] : [r, g, b];
};

export const getRandomHex = () => {
  const hexArr = Array.from({ length: 3 }, () =>
    getRandomInt(0, 255).toString(16).padStart(2, "0"),
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
export const rgbToHSL = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // Achromatic (gray)
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
};

export const adjustHexLightness = (hex: string, percent: number) => {
  const [r, g, b] = hexToRGB(hex, true);

  const [h, s, _l] = rgbToHSL(r, g, b);

  // Adjust the Lightness value (L) by the given percentage
  // This scales down the existing lightness (e.g., 50% lightness darkened by 20% becomes 40%)
  const l = Math.max(0, _l * (1 - percent / 100));

  // 5. Convert HSL back to RGB
  let rOut, gOut, bOut;
  if (s === 0) {
    rOut = gOut = bOut = 255; // Achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let out = p;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) out = p + (q - p) * 6 * t;
      else if (t < 1 / 2) out = q;
      else if (t < 2 / 3) out = p + (q - p) * (2 / 3 - t) * 6;
      return Math.round(out * 255);
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rOut = hue2rgb(p, q, h + 1 / 3);
    gOut = hue2rgb(p, q, h);
    bOut = hue2rgb(p, q, h - 1 / 3);
  }

  return rgbToHex([rOut, gOut, bOut]);
};

type ColorMap = [number, number, number];
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
