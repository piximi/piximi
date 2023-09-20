export const CATEGORY_COLORS = {
  black: "#000000",
  indianred: "#C84C4C",
  red: "#E60000",
  darkred: "#8B0000",
  mediumvioletred: "#C71585",
  palevioletred: "#DB7093",
  sherpablue: "#004949",
  darkcyan: "#009292",
  indigo: "#490092",
  navyblue: "#006ddb",
  heliotrope: "#b66dff",
  mayablue: "#6db6ff",
  columbiablue: "#b6dbff",
  olive: "#924900",
  mangotango: "#db6d00",
  green: "#237700",
  citrus: "#a89d00",
};

export const UNKNOWN_IMAGE_CATEGORY_COLOR = "#AAAAAA";
export const UNKNOWN_ANNOTATION_CATEGORY_COLOR = "#920000";

export const APPLICATION_COLORS = {
  classifierList: "#DCF3F450",
  segmenterList: "#E9E5FA50",
  borderColor: "#0000001f",
  highlightColor: "#0000000a",
};

const convertHexToRGBA = (hexCode: string, opacity = 1) => {
  let hex = hexCode.replace("#", "");

  if (hex.length === 3) {
    hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  /* Backward compatibility for whole number based opacity values. */
  if (opacity > 1 && opacity <= 100) {
    opacity = opacity / 100;
  }

  return { r, g, b };
};

const relativeLuminance = (hexColor: string) => {
  if (hexColor.length > 7) return 0;
  const { r, g, b } = convertHexToRGBA(hexColor);

  const R_s = r / 255;
  const G_s = g / 255;
  const B_s = b / 255;

  const R = R_s <= 0.03928 ? R_s / 12.92 : ((R_s + 0.055) / 1.055) ** 2.4;
  const G = G_s <= 0.03928 ? G_s / 12.92 : ((G_s + 0.055) / 1.055) ** 2.4;
  const B = B_s <= 0.03928 ? B_s / 12.92 : ((B_s + 0.055) / 1.055) ** 2.4;

  const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;

  return lum;
};

const contrastRatio = (l1: number, l2: number) => {
  /*
    contrast ration = (L1 + 0.05) / (L2 + 0.05)
    L1 => lighter of the colors
    L2 => darker of the colors
  */
  return (l1 + 0.05) / (l2 + 0.05);
};

export const contrastingText = (backgroundColor: string) => {
  const whiteLum = 1;
  const blackLum = 0;
  const backgroundLum = relativeLuminance(backgroundColor);

  const whiteTextRatio = contrastRatio(whiteLum, backgroundLum);
  const blackTextRatio = contrastRatio(backgroundLum, blackLum);

  // min contrast should be 4.5:1

  return whiteTextRatio > blackTextRatio ? "white" : "black";
};
