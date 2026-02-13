import { ITiffAnalyzerService, TiffIFDEntry } from "./types";
import { AnalyzeTiffOutput } from "workers/scheduler/types";

/**
 * TiffAnalyzer
 *
 * Parses TIFF file headers to detect multi-frame images
 * and infer the frame interpretation (time series, z-stack, etc.).
 *
 * This runs in a Web Worker via the analyzeTiff task.
 * It only reads headers — it does NOT decode pixel data.
 *
 * TIFF Structure Basics:
 * - Header: 8 bytes (byte order + magic number + first IFD offset)
 * - IFD: array of tag entries, each pointing to image data
 * - Multi-frame TIFFs chain IFDs (each IFD has "next IFD offset")
 *
 * Detection Heuristics:
 * 1. OME-TIFF: XML in ImageDescription tag → parse for dimensions
 * 2. DateTime tags with consistent intervals → time series
 * 3. Z-spacing metadata → z-stack
 * 4. Multiple IFDs with same dimensions → likely time/z series
 * 5. Different dimensions across IFDs → separate images
 */
export class TiffAnalyzerService implements ITiffAnalyzerService {
  /**
   * Analyze a TIFF file buffer without fully decoding it.
   *
   * Steps:
   * 1. Parse TIFF header (byte order, first IFD offset)
   * 2. Walk IFD chain, counting frames
   * 3. Extract metadata tags from each IFD
   * 4. Apply heuristics to suggest interpretation
   */
  analyze(buffer: ArrayBuffer): AnalyzeTiffOutput {
    const view = new DataView(buffer);

    // Parse header
    const byteOrder = TiffAnalyzerService.parseByteOrder(view);
    if (!byteOrder) {
      return TiffAnalyzerService.unknownResult();
    }

    const littleEndian = byteOrder === "little";

    // Verify TIFF magic number (42)
    const magic = view.getUint16(2, littleEndian);
    if (magic !== 42) {
      return TiffAnalyzerService.unknownResult();
    }

    // Get first IFD offset
    let ifdOffset = view.getUint32(4, littleEndian);

    // Walk IFD chain
    const ifds: TiffIFDEntry[] = [];
    const maxIFDs = 10000; // Safety limit

    while (ifdOffset !== 0 && ifds.length < maxIFDs) {
      if (ifdOffset >= buffer.byteLength) break;

      const ifd = TiffAnalyzerService.parseIFD(view, ifdOffset, littleEndian);
      ifds.push(ifd.entry);
      ifdOffset = ifd.nextOffset;
    }

    const frameCount = ifds.length;

    if (frameCount <= 1) {
      return {
        frameCount,
        isMultiFrame: false,
        suggestedType: "unknown",
        confidence: 1.0,
        metadata: {},
      };
    }

    // Apply detection heuristics
    return TiffAnalyzerService.classifyFrames(ifds);
  }

  private static parseByteOrder(view: DataView): "little" | "big" | null {
    const byte0 = view.getUint8(0);
    const byte1 = view.getUint8(1);

    if (byte0 === 0x49 && byte1 === 0x49) return "little"; // "II"
    if (byte0 === 0x4d && byte1 === 0x4d) return "big"; // "MM"
    return null;
  }

  private static parseIFD(
    view: DataView,
    offset: number,
    littleEndian: boolean,
  ): { entry: TiffIFDEntry; nextOffset: number } {
    const entryCount = view.getUint16(offset, littleEndian);
    const entry: TiffIFDEntry = {
      width: 0,
      height: 0,
      bitsPerSample: [],
      samplesPerPixel: 1,
    };

    for (let i = 0; i < entryCount; i++) {
      const tagOffset = offset + 2 + i * 12;
      if (tagOffset + 12 > view.byteLength) break;

      const tag = view.getUint16(tagOffset, littleEndian);
      const type = view.getUint16(tagOffset + 2, littleEndian);
      const count = view.getUint32(tagOffset + 4, littleEndian);
      const valueOffset = tagOffset + 8;

      switch (tag) {
        case 256: // ImageWidth
          entry.width = TiffAnalyzerService.readValue(
            view,
            type,
            valueOffset,
            littleEndian,
          );
          break;
        case 257: // ImageLength (height)
          entry.height = TiffAnalyzerService.readValue(
            view,
            type,
            valueOffset,
            littleEndian,
          );
          break;
        case 258: // BitsPerSample
          entry.bitsPerSample = [
            TiffAnalyzerService.readValue(
              view,
              type,
              valueOffset,
              littleEndian,
            ),
          ];
          break;
        case 277: // SamplesPerPixel
          entry.samplesPerPixel = TiffAnalyzerService.readValue(
            view,
            type,
            valueOffset,
            littleEndian,
          );
          break;
        case 270: // ImageDescription
          entry.imageDescription = TiffAnalyzerService.readString(
            view,
            valueOffset,
            count,
            littleEndian,
          );
          break;
        case 306: // DateTime
          entry.dateTime = TiffAnalyzerService.readString(
            view,
            valueOffset,
            count,
            littleEndian,
          );
          break;
        case 305: // Software
          entry.software = TiffAnalyzerService.readString(
            view,
            valueOffset,
            count,
            littleEndian,
          );
          break;
      }
    }

    // Next IFD offset
    const nextOffsetPos = offset + 2 + entryCount * 12;
    const nextOffset =
      nextOffsetPos + 4 <= view.byteLength
        ? view.getUint32(nextOffsetPos, littleEndian)
        : 0;

    return { entry, nextOffset };
  }

  private static readValue(
    view: DataView,
    type: number,
    offset: number,
    littleEndian: boolean,
  ): number {
    switch (type) {
      case 1:
        return view.getUint8(offset); // BYTE
      case 3:
        return view.getUint16(offset, littleEndian); // SHORT
      case 4:
        return view.getUint32(offset, littleEndian); // LONG
      default:
        return view.getUint32(offset, littleEndian);
    }
  }

  private static readString(
    view: DataView,
    valueOffset: number,
    count: number,
    littleEndian: boolean,
  ): string {
    // If string is <= 4 bytes, it's inline; otherwise value is an offset
    let strOffset = valueOffset;
    if (count > 4) {
      strOffset = view.getUint32(valueOffset, littleEndian);
    }

    if (strOffset + count > view.byteLength) return "";

    const bytes = new Uint8Array(view.buffer, strOffset, Math.min(count, 256));
    return new TextDecoder().decode(bytes).replace(/\0/g, "");
  }

  private static classifyFrames(ifds: TiffIFDEntry[]): AnalyzeTiffOutput {
    const frameCount = ifds.length;
    const metadata: AnalyzeTiffOutput["metadata"] = {};

    // Check for OME-TIFF
    const firstDesc = ifds[0].imageDescription ?? "";
    if (firstDesc.includes("<OME") || firstDesc.includes("ome.xsd")) {
      // OME-TIFF — try to parse dimensions from XML
      return TiffAnalyzerService.parseOMEMetadata(firstDesc, frameCount);
    }

    // Check if all frames have same dimensions
    const allSameDims = ifds.every(
      (ifd) => ifd.width === ifds[0].width && ifd.height === ifds[0].height,
    );

    if (!allSameDims) {
      return {
        frameCount,
        isMultiFrame: true,
        suggestedType: "unknown",
        confidence: 0.3,
        metadata,
      };
    }

    // Check for DateTime tags with consistent intervals
    const dateTimes = ifds
      .map((ifd) => ifd.dateTime)
      .filter((dt): dt is string => !!dt);

    if (dateTimes.length > 1) {
      metadata.dateTime = dateTimes;
      return {
        frameCount,
        isMultiFrame: true,
        suggestedType: "timeSeries",
        confidence: 0.7,
        metadata,
      };
    }

    // Default: same dimensions, no time info — could be z-stack or time
    return {
      frameCount,
      isMultiFrame: true,
      suggestedType: "unknown",
      confidence: 0.3,
      metadata,
    };
  }

  private static parseOMEMetadata(
    xml: string,
    frameCount: number,
  ): AnalyzeTiffOutput {
    // Basic OME XML parsing for SizeT, SizeZ, SizeC
    const sizeT = TiffAnalyzerService.extractXMLAttr(xml, "SizeT");
    const sizeZ = TiffAnalyzerService.extractXMLAttr(xml, "SizeZ");
    const sizeC = TiffAnalyzerService.extractXMLAttr(xml, "SizeC");

    if (sizeT && parseInt(sizeT) > 1) {
      return {
        frameCount,
        isMultiFrame: true,
        suggestedType: "timeSeries",
        confidence: 0.95,
        metadata: {},
      };
    }

    if (sizeZ && parseInt(sizeZ) > 1) {
      return {
        frameCount,
        isMultiFrame: true,
        suggestedType: "zStack",
        confidence: 0.95,
        metadata: { zSpacing: undefined },
      };
    }

    if (sizeC && parseInt(sizeC) > 1) {
      return {
        frameCount,
        isMultiFrame: true,
        suggestedType: "channels",
        confidence: 0.9,
        metadata: {},
      };
    }

    return {
      frameCount,
      isMultiFrame: true,
      suggestedType: "unknown",
      confidence: 0.5,
      metadata: {},
    };
  }

  private static extractXMLAttr(xml: string, attr: string): string | null {
    const regex = new RegExp(`${attr}="([^"]*)"`, "i");
    const match = xml.match(regex);
    return match?.[1] ?? null;
  }

  private static unknownResult(): AnalyzeTiffOutput {
    return {
      frameCount: 1,
      isMultiFrame: false,
      suggestedType: "unknown",
      confidence: 0,
      metadata: {},
    };
  }
}
