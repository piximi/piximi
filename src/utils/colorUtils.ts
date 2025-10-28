export const getRandomHexColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const getRestrictedRandomHexColor = (options: {
  similarity: { baseColor: string; minDifference: number };
}) => {
  let color = getRandomHexColor();
  if (options.similarity) {
    const { baseColor: baseColor, minDifference: minDifference } =
      options.similarity;
    while (colorSimilarity(baseColor, color) < minDifference) {
      color = getRandomHexColor();
    }
  }
  return color;
};

/**
 * Conver number between 0 and 1 into the haxidecimal value
 * @param c - number between 0 and 1
 * @returns Hexidecimal value
 *
 */
const componentToHex = (c: number) => {
  const hex = (c * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

/**
 * Convert an array of RGB values into a hexidecimal color
 * @param rgb - Array of RGB values normalized between 0 and 1 [R, G, B]
 * @returns Hexidecimal Color
 *
 */
export const rgbToHex = (rgb: [number, number, number]) => {
  return (
    "#" +
    componentToHex(rgb[0]) +
    componentToHex(rgb[1]) +
    componentToHex(rgb[2])
  );
};

/**
 * Validates if a string is a valid hex color code
 * @param color - The color string to validate
 * @returns true if valid hex color, false otherwise
 *
 * Supports:
 * - 3-digit hex: #RGB
 * - 6-digit hex: #RRGGBB
 * - 8-digit hex with alpha: #RRGGBBAA
 */
export const isValidHexColor = (color: string): boolean => {
  if (!color || typeof color !== "string") {
    return false;
  }
  // Regular expression for valid hex colors
  // Matches: #RGB, #RRGGBB, #RRGGBBAA (case-insensitive)
  const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

  return hexColorRegex.test(color);
};

export const hexAlpha = (hexColor: string, alpha: number) => {
  if (!isValidHexColor(hexColor)) {
    console.error(`${hexColor} is not a valid hex color`);
    return hexColor;
  }
  if (alpha > 1) alpha = alpha / 10 ** (Math.floor(Math.log10(alpha)) + 1);

  const halpha = componentToHex(alpha);
  if (hexColor.length === 9) {
    hexColor = hexColor.slice(0, 7);
  }
  return hexColor + halpha;
};

export const hexDistance = (hex1: string, hex2: string) => {
  if (!isValidHexColor(hex1) || !isValidHexColor(hex2)) {
    console.error("Both colors need to be valid hex");
    return 0;
  }
  const h1x = Number("0x" + hex1.substring(1, 3));
  const h1y = Number("0x" + hex1.substring(3, 5));
  const h1z = Number("0x" + hex1.substring(5, 7));
  const h2x = Number("0x" + hex2.substring(1, 3));
  const h2y = Number("0x" + hex2.substring(3, 5));
  const h2z = Number("0x" + hex2.substring(5, 7));

  return Math.sqrt((h2x - h1x) ** 2 + (h2y - h1y) ** 2 + (h2z - h1z) ** 2);
};

interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

interface LAB {
  l: number; // 0-100
  a: number; // typically -128 to 127
  b: number; // typically -128 to 127
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error("Invalid hex color");
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to XYZ color space
 */
function rgbToXyz(rgb: RGB): { x: number; y: number; z: number } {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  // Convert to XYZ using D65 illuminant
  return {
    x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y: r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    z: r * 0.0193339 + g * 0.119192 + b * 0.9503041,
  };
}

/**
 * Convert XYZ to LAB color space
 */
function xyzToLab(xyz: { x: number; y: number; z: number }): LAB {
  // D65 reference white point
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  let x = xyz.x / refX;
  let y = xyz.y / refY;
  let z = xyz.z / refZ;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

/**
 * Convert hex color to LAB
 */
function hexToLab(hex: string): LAB {
  const rgb = hexToRgb(hex);
  const xyz = rgbToXyz(rgb);
  return xyzToLab(xyz);
}

/**
 * Calculate CIEDE2000 Delta E
 * This is the most accurate perceptual color difference formula
 */
function deltaE2000(lab1: LAB, lab2: LAB): number {
  // Weight factors
  const kL = 1;
  const kC = 1;
  const kH = 1;

  const L1 = lab1.l;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.l;
  const a2 = lab2.a;
  const b2 = lab2.b;

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
}
/**
 * Calculate color similarity between two hex colors using Delta E
 * Returns a value where:
 * - < 1: Colors are virtually identical
 * - 1-2: Perceptible with close observation
 * - 2-10: Perceptible at a glance
 * - > 10: Very different colors
 */
export function colorSimilarity(hex1: string, hex2: string): number {
  const lab1 = hexToLab(hex1);
  const lab2 = hexToLab(hex2);
  return deltaE2000(lab1, lab2);
}
