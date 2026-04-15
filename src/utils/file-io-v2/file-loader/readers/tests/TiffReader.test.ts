import { describe, it, expect } from "vitest";
import { analyzeTiff } from "../TiffReader";

/**
 * Helper to create a minimal TIFF buffer with specified IFD count
 */
function createMinimalTiff(
  ifdCount: number,
  options?: { dateTime?: boolean },
): ArrayBuffer {
  // Minimal TIFF: Little-endian, magic 42, single IFD
  // This is a simplified builder for testing the parser
  const headerSize = 8;
  const ifdEntrySize = 12;
  const entriesPerIFD = options?.dateTime ? 4 : 3; // width, height, bitsPerSample + optional dateTime
  const ifdSize = 2 + entriesPerIFD * ifdEntrySize + 4; // count + entries + next offset
  const totalSize = headerSize + ifdCount * ifdSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Header: Little-endian
  view.setUint8(0, 0x49); // 'I'
  view.setUint8(1, 0x49); // 'I'
  view.setUint16(2, 42, true); // Magic
  view.setUint32(4, headerSize, true); // First IFD offset

  let offset = headerSize;

  for (let i = 0; i < ifdCount; i++) {
    // IFD entry count
    view.setUint16(offset, entriesPerIFD, true);
    offset += 2;

    // Tag: ImageWidth (256) = 100
    view.setUint16(offset, 256, true);
    view.setUint16(offset + 2, 3, true); // SHORT
    view.setUint32(offset + 4, 1, true); // count
    view.setUint16(offset + 8, 100, true); // value
    offset += ifdEntrySize;

    // Tag: ImageLength (257) = 100
    view.setUint16(offset, 257, true);
    view.setUint16(offset + 2, 3, true); // SHORT
    view.setUint32(offset + 4, 1, true); // count
    view.setUint16(offset + 8, 100, true); // value
    offset += ifdEntrySize;

    // Tag: BitsPerSample (258) = 8
    view.setUint16(offset, 258, true);
    view.setUint16(offset + 2, 3, true); // SHORT
    view.setUint32(offset + 4, 1, true); // count
    view.setUint16(offset + 8, 8, true); // value
    offset += ifdEntrySize;

    if (options?.dateTime) {
      // Tag: DateTime (306) — inline 4-byte string
      view.setUint16(offset, 306, true);
      view.setUint16(offset + 2, 2, true); // ASCII
      view.setUint32(offset + 4, 4, true); // count
      // Inline value (4 chars max)
      view.setUint8(offset + 8, 0x32); // '2'
      view.setUint8(offset + 9, 0x30); // '0'
      view.setUint8(offset + 10, 0x32); // '2'
      view.setUint8(offset + 11, 0x36); // '6'
      offset += ifdEntrySize;
    }

    // Next IFD offset
    const nextOffset = i < ifdCount - 1 ? offset + 4 : 0;
    view.setUint32(offset, nextOffset, true);
    offset += 4;
  }

  return buffer;
}

describe("TiffAnalyzerService", () => {
  it("should detect single-frame TIFF as non-multiframe", async () => {
    const buffer = createMinimalTiff(1);
    const result = await analyzeTiff(buffer);

    expect(result.frameCount).toBe(1);
    expect(result.isMultiFrame).toBe(false);
  });

  it("should detect multi-frame TIFF", async () => {
    const buffer = createMinimalTiff(10);
    const result = await analyzeTiff(buffer);

    expect(result.frameCount).toBe(10);
    expect(result.isMultiFrame).toBe(true);
  });

  it("should reject malformed TIFF with mixed endianness", async () => {
    const buffer = createMinimalTiff(1);
    const view = new DataView(buffer);
    // Patch header to claim big-endian while IFD entries remain little-endian
    view.setUint8(0, 0x4d); // 'M'
    view.setUint8(1, 0x4d); // 'M'
    view.setUint16(2, 42, false); // Magic (big-endian)
    view.setUint32(4, 8, false); // First IFD offset (big-endian)

    // geotiff reads IFD type fields in big-endian mode → 0x0300 = 768, not a valid field type
    await expect(analyzeTiff(buffer)).rejects.toThrow();
  });
});
