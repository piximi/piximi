import { describe, expect, it } from "vitest";

import {
  adjustHexLightness,
  colorSimilarity,
  getDistinctHex,
  hexToLab,
  hexToRGB,
  rgbToHSL,
  rgbToHex,
  rgbToXyz,
  xyzToLab,
} from "./colorUtils";

type Triple = [number, number, number];

const expectTriple = (
  actual: number[],
  expected: Triple,
  precision: number,
) => {
  expect(actual).toHaveLength(3);
  expected.forEach((value, i) => {
    expect(actual[i]).toBeCloseTo(value, precision);
  });
};

describe("hexToRGB", () => {
  it("parses 6-digit hex as 0-255 by default", () => {
    expect(hexToRGB("#FBB904")).toEqual([251, 185, 4]);
  });

  it("does not require a leading #", () => {
    expect(hexToRGB("FBB904")).toEqual([251, 185, 4]);
  });

  it("expands 3-digit hex", () => {
    expect(hexToRGB("#f80")).toEqual([255, 136, 0]);
  });

  it("scales RGB to 0-1 when asked to", () => {
    expect(hexToRGB("#ff0033", { toFractional: true })).toEqual([1, 0, 0.2]);
  });

  it("scales alpha from 8-digit hex to 0-1", () => {
    expect(hexToRGB("#ff000033")).toEqual([255, 0, 0, 0.2]);
  });

  it("prefers the alpha argument over alpha in the hex", () => {
    expect(hexToRGB("#ff000033", { toFractional: false, alpha: 0.5 })).toEqual([
      255, 0, 0, 0.5,
    ]);
  });
});

describe("rgbToHex", () => {
  it("converts 0-255 components", () => {
    expect(rgbToHex([251, 185, 4])).toBe("#fbb904");
  });

  it("converts unit components", () => {
    expect(rgbToHex([0.2, 0.5, 0.87], { fractional: true })).toBe("#3380de");
  });

  it("pads single digit components", () => {
    expect(rgbToHex([255, 4, 15])).toBe("#ff040f");
  });

  it("round trips with hexToRGB", () => {
    const [r, g, b] = hexToRGB("#fbb904");

    expect(rgbToHex([r, g, b])).toBe("#fbb904");
  });

  it("produces white with fractional true mismatch", () => {
    expect(rgbToHex([255, 4, 15], { fractional: true })).toBe("#ffffff");
  });

  it("produces black with fractional false mismatch", () => {
    const [r, g, b] = hexToRGB(
      rgbToHex([0.2, 0.4, 0.5], { fractional: false }),
    );
    expect(r).toBeLessThanOrEqual(1);
    expect(g).toBeLessThanOrEqual(1);
    expect(b).toBeLessThanOrEqual(1);
  });
});

describe("rgbToHSL", () => {
  it.each<[string, Triple, Triple]>([
    ["red", [1, 0, 0], [0, 1, 0.5]],
    ["green", [0, 1, 0], [1 / 3, 1, 0.5]],
    ["blue", [0, 0, 1], [2 / 3, 1, 0.5]],
    ["light red", [1, 0.5, 0.5], [0, 1, 0.75]],
    ["gray", [0.5, 0.5, 0.5], [0, 0, 0.5]],
  ])("converts %s", (_, [r, g, b], expected) => {
    expectTriple(rgbToHSL(r, g, b), expected, 5);
  });
});

// Expected values are the sRGB primaries under D65 (IEC 61966-2-1)
describe("rgbToXyz", () => {
  it.each<[string, Triple, Triple]>([
    ["black", [0, 0, 0], [0, 0, 0]],
    ["white", [255, 255, 255], [95.047, 100, 108.883]],
    ["red", [255, 0, 0], [41.2456, 21.2673, 1.9334]],
    ["green", [0, 255, 0], [35.7576, 71.5152, 11.9192]],
    ["blue", [0, 0, 255], [18.0438, 7.2175, 95.0304]],
  ])("converts %s", (_, rgb, expected) => {
    expectTriple(rgbToXyz(rgb), expected, 3);
  });

  it("uses the linear segment of the gamma curve for dark values", () => {
    // 10 / 255 is below the 0.04045 cutoff, so Y = 100 * (10 / 255) / 12.92
    expect(rgbToXyz([10, 10, 10])[1]).toBeCloseTo(0.3035, 3);
  });
});

describe("xyzToLab", () => {
  it("maps the D65 white point to L=100 with no chroma", () => {
    expectTriple(xyzToLab([95.047, 100, 108.883]), [100, 0, 0], 5);
  });

  it("maps black to zero", () => {
    expectTriple(xyzToLab([0, 0, 0]), [0, 0, 0], 5);
  });

  it("uses the linear segment of the curve for dark values", () => {
    // Below the 0.008856 cutoff L is approximately 903.3 * Y
    const [l] = xyzToLab([0.0951, 0.1, 0.1089]);

    expect(l).toBeCloseTo(0.9033, 2);
  });
});

// Expected values are the standard CIELAB coordinates of sRGB colors under D65
describe("hexToLab", () => {
  it.each<[string, string, Triple]>([
    ["black", "#000000", [0, 0, 0]],
    ["white", "#ffffff", [100, 0, 0]],
    ["red", "#ff0000", [53.24, 80.09, 67.2]],
    ["green", "#00ff00", [87.73, -86.18, 83.18]],
    ["blue", "#0000ff", [32.3, 79.19, -107.86]],
    ["gray", "#808080", [53.59, 0, 0]],
  ])("converts %s", (_, hex, expected) => {
    expectTriple(hexToLab(hex), expected, 1);
  });

  it("ignores alpha", () => {
    expect(hexToLab("#ff000080")).toEqual(hexToLab("#ff0000"));
  });
});

describe("colorSimilarity", () => {
  it("is zero for identical colors", () => {
    expect(colorSimilarity("#fbb904", "#fbb904")).toBe(0);
  });

  it("does not depend on hex casing or shorthand", () => {
    expect(colorSimilarity("#FF8800", "#f80")).toBe(0);
  });

  it.each<[string, string, number]>([
    ["#000000", "#ffffff", 100],
    ["#ff0000", "#00ff00", 86.61],
    ["#ff0000", "#0000ff", 52.88],
    ["#00ff00", "#0000ff", 83.19],
  ])("matches the CIEDE2000 value for %s and %s", (hex1, hex2, expected) => {
    expect(colorSimilarity(hex1, hex2)).toBeCloseTo(expected, 1);
  });

  it("is symmetric", () => {
    expect(colorSimilarity("#fbb904", "#3366cc")).toBeCloseTo(
      colorSimilarity("#3366cc", "#fbb904"),
      10,
    );
  });

  it("grows as colors get further apart", () => {
    const near = colorSimilarity("#fbb904", "#ffd000");
    const far = colorSimilarity("#fbb904", "#000000");

    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
  });
});

describe("adjustHexLightness", () => {
  describe("chromatic colors", () => {
    it.each<[string, number, string]>([
      ["#ff0000", 20, "#cc0000"],
      ["#336699", 20, "#29527a"],
      ["#336699", 0, "#336699"],
      ["#336699", 100, "#000000"],
    ])("darkens %s by %i%%", (hex, percent, expected) => {
      expect(adjustHexLightness(hex, percent)).toBe(expected);
    });

    it("keeps a channel that darkens to 1 out of 255", () => {
      expect(adjustHexLightness("#020000", 50)).toBe("#010000");
    });
  });

  describe("achromatic colors", () => {
    it.each<[string, number, string]>([
      ["#808080", 20, "#666666"],
      ["#808080", 0, "#808080"],
      ["#808080", 100, "#000000"],
      ["#ffffff", 50, "#808080"],
      ["#000000", 20, "#000000"],
    ])("darkens %s by %i%%", (hex, percent, expected) => {
      expect(adjustHexLightness(hex, percent)).toBe(expected);
    });
  });
});

describe("getDistinctHex", () => {
  it("returns a color when the threshold is unreachable", () => {
    const color = getDistinctHex({ baseColor: "#FBB904", maxSimilarity: 1000 });

    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
