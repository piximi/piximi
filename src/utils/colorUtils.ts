import { getRandomInt } from "./dataUtils";

import type { BitDepth } from "core/entities";

type ColorArray = [number, number, number];
type AlphaColorArray = [number, number, number, number];

const componentToHex = (c: number): string => {
  return Math.min(255, Math.max(0, Math.round(c)))
    .toString(16)
    .padStart(2, "0");
};

export const rgbToHex = (
  rgb: ColorArray,
  options: { fractional: boolean } = { fractional: false },
): string => {
  return `#${rgb.reduce(
    (hex: string, c) =>
      hex + componentToHex(options.fractional ? Math.round(c * 255) : c),
    "",
  )}`;
};

/**
 * Converts a hex color string to an array of numeric color components.
 *
 * @param hex - Color in 3-, 6-, or 8-digit hex form, with or without a leading `#`.
 * @param options.toFractional - If `true`, normalizes the RGB components to 0-1; if `false` (the default), returns them as 0-255.
 * @param options.alpha - Alpha value to append. Takes precedence over any alpha in `hex`.
 * @returns `[r, g, b, a]` if an alpha is resolved, otherwise `[r, g, b]`.
 *
 * @remarks
 * `toFractional` applies only to RGB: `options.alpha` is returned as given, and
 * alpha parsed from an 8-digit hex is always scaled to 0-1. An alpha of `0` is kept.
 */
export const hexToRGB = (
  hex: string,
  options: {
    toFractional: boolean;
    alpha?: number;
  } = { toFractional: false },
): ColorArray | AlphaColorArray => {
  let cleanHex = hex.replace(/^#/, "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const a =
    options.alpha !== undefined
      ? options.alpha
      : cleanHex.length === 8
        ? parseInt(cleanHex.slice(6, 8), 16) / 255
        : undefined;

  const scaleFactor = options.toFractional ? 255 : 1;

  // 2. Convert Hex to RGB fractions (0 to 1)
  const r = parseInt(cleanHex.substring(0, 2), 16) / scaleFactor;
  const g = parseInt(cleanHex.substring(2, 4), 16) / scaleFactor;
  const b = parseInt(cleanHex.substring(4, 6), 16) / scaleFactor;
  return a !== undefined ? [r, g, b, a] : [r, g, b];
};

/**
 * Convert RGB to XYZ color space
 */
export const rgbToXyz = (rgb: ColorArray): ColorArray => {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;

  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  // Convert to XYZ using D65 illuminant

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

  return [x, y, z];
};

/**
 * Convert XYZ to LAB color space
 */
export const xyzToLab = (xyz: ColorArray): ColorArray => {
  // D65 reference white point
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  let x = xyz[0] / refX;
  let y = xyz[1] / refY;
  let z = xyz[2] / refZ;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return [l, a, b];
};

/**
 * Convert hex color to LAB
 */
export const hexToLab = (hex: string): ColorArray => {
  const rgb = hexToRGB(hex);
  const xyz = rgbToXyz([rgb[0], rgb[1], rgb[2]]);
  return xyzToLab(xyz);
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

/**
 * Darkens a hex color by reducing its HSL lightness, keeping hue and saturation.
 *
 * @param hex - Color in 3-, 6-, or 8-digit hex form, with or without a leading `#`.
 * @param percent - How much to reduce the lightness by, relative to its current
 * value: `20` turns 50% lightness into 40%, `0` keeps it, and `100` or more gives black.
 * @returns The adjusted color as a 6-digit lowercase hex string. Any alpha is dropped.
 */
export const adjustHexLightness = (hex: string, percent: number) => {
  const [r, g, b] = hexToRGB(hex, { toFractional: true });

  const [h, s, _l] = rgbToHSL(r, g, b);

  // Adjust the Lightness value (L) by the given percentage
  // This scales down the existing lightness (e.g., 50% lightness darkened by 20% becomes 40%)
  const l = Math.max(0, _l * (1 - percent / 100));

  // 5. Convert HSL back to RGB
  let rOut, gOut, bOut;
  if (s === 0) {
    rOut = gOut = bOut = Math.round(l * 255); // Achromatic
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

//the default colors assigned to a loaded image
export const CHANNEL_COLOR_MAPS: Record<string, ColorArray> = {
  RED: [1, 0, 0],
  GREEN: [0, 1, 0],
  BLUE: [0, 0, 1],
  YELLOW: [1, 1, 0],
  CYAN: [0, 1, 1],
  MAGENTA: [1, 0, 1],
  WHITE: [1, 1, 1],
};
export const DEFAULT_COLORS: Array<ColorArray> = [
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
  colorMap: ColorArray;
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

/**
 * Calculate CIEDE2000 Delta E
 * This is the most accurate perceptual color difference formula
 */
const deltaE2000 = (lab1: ColorArray, lab2: ColorArray): number => {
  // Weight factors
  const kL = 1;
  const kC = 1;
  const kH = 1;

  const L1 = lab1[0];
  const a1 = lab1[1];
  const b1 = lab1[2];
  const L2 = lab2[0];
  const a2 = lab2[1];
  const b2 = lab2[2];

  // Calculate C and h
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const C_avg = (C1 + C2) / 2;

  const G =
    0.5 *
    (1 -
      Math.sqrt(Math.pow(C_avg, 7) / (Math.pow(C_avg, 7) + Math.pow(25, 7))));

  const a1_prime = a1 * (1 + G);
  const a2_prime = a2 * (1 + G);

  const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
  const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);

  const h1_prime = Math.atan2(b1, a1_prime) * (180 / Math.PI);
  const h2_prime = Math.atan2(b2, a2_prime) * (180 / Math.PI);

  const h1_prime_normalized = h1_prime >= 0 ? h1_prime : h1_prime + 360;
  const h2_prime_normalized = h2_prime >= 0 ? h2_prime : h2_prime + 360;

  // Calculate delta values
  const delta_L_prime = L2 - L1;
  const delta_C_prime = C2_prime - C1_prime;

  let delta_h_prime;
  if (C1_prime * C2_prime === 0) {
    delta_h_prime = 0;
  } else if (Math.abs(h2_prime_normalized - h1_prime_normalized) <= 180) {
    delta_h_prime = h2_prime_normalized - h1_prime_normalized;
  } else if (h2_prime_normalized - h1_prime_normalized > 180) {
    delta_h_prime = h2_prime_normalized - h1_prime_normalized - 360;
  } else {
    delta_h_prime = h2_prime_normalized - h1_prime_normalized + 360;
  }

  const delta_H_prime =
    2 *
    Math.sqrt(C1_prime * C2_prime) *
    Math.sin((delta_h_prime / 2) * (Math.PI / 180));

  // Calculate average values
  const L_avg_prime = (L1 + L2) / 2;
  const C_avg_prime = (C1_prime + C2_prime) / 2;

  let h_avg_prime;
  if (C1_prime * C2_prime === 0) {
    h_avg_prime = h1_prime_normalized + h2_prime_normalized;
  } else if (Math.abs(h1_prime_normalized - h2_prime_normalized) <= 180) {
    h_avg_prime = (h1_prime_normalized + h2_prime_normalized) / 2;
  } else if (h1_prime_normalized + h2_prime_normalized < 360) {
    h_avg_prime = (h1_prime_normalized + h2_prime_normalized + 360) / 2;
  } else {
    h_avg_prime = (h1_prime_normalized + h2_prime_normalized - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(((h_avg_prime - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * h_avg_prime * Math.PI) / 180) +
    0.32 * Math.cos(((3 * h_avg_prime + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * h_avg_prime - 63) * Math.PI) / 180);

  const delta_theta = 30 * Math.exp(-Math.pow((h_avg_prime - 275) / 25, 2));

  const R_C =
    2 *
    Math.sqrt(
      Math.pow(C_avg_prime, 7) / (Math.pow(C_avg_prime, 7) + Math.pow(25, 7)),
    );

  const S_L =
    1 +
    (0.015 * Math.pow(L_avg_prime - 50, 2)) /
      Math.sqrt(20 + Math.pow(L_avg_prime - 50, 2));
  const S_C = 1 + 0.045 * C_avg_prime;
  const S_H = 1 + 0.015 * C_avg_prime * T;

  const R_T = -Math.sin((2 * delta_theta * Math.PI) / 180) * R_C;

  // Calculate Delta E
  const deltaE = Math.sqrt(
    Math.pow(delta_L_prime / (kL * S_L), 2) +
      Math.pow(delta_C_prime / (kC * S_C), 2) +
      Math.pow(delta_H_prime / (kH * S_H), 2) +
      R_T * (delta_C_prime / (kC * S_C)) * (delta_H_prime / (kH * S_H)),
  );

  return deltaE;
};
/**
 * Calculate color similarity between two hex colors using Delta E
 * Returns a value where:
 * - < 1: Colors are virtually identical
 * - 1-2: Perceptible with close observation
 * - 2-10: Perceptible at a glance
 * - > 10: Very different colors
 */
export const colorSimilarity = (hex1: string, hex2: string): number => {
  const lab1 = hexToLab(hex1);
  const lab2 = hexToLab(hex2);
  return deltaE2000(lab1, lab2);
};

const MAX_ATTEMPTS = 100;

export const getDistinctHex = ({
  baseColor,
  maxSimilarity,
}: {
  baseColor: string;
  maxSimilarity: number;
}) => {
  let best = getRandomHex();
  let bestDifference = colorSimilarity(baseColor, best);

  for (let i = 1; i < MAX_ATTEMPTS && bestDifference < maxSimilarity; i++) {
    const candidate = getRandomHex();
    const difference = colorSimilarity(baseColor, candidate);
    if (difference > bestDifference) {
      best = candidate;
      bestDifference = difference;
    }
  }

  return best;
};
