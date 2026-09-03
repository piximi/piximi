import { fromArrayBuffer } from "geotiff";
import { XMLParser } from "fast-xml-parser";

import { parseError } from "utils/logUtils";
import type { TaskError } from "utils/types";

import { loadImageFromBuffer } from "../imageReaderUtils";
import { MIME } from "../types";
import { overallProgress } from "../progress";

import type { GeoTIFFImage } from "geotiff";
import type {
  OMEDims,
  AnalyzeTiffOutput,
  IFileReader,
  ReaderInput,
  ReaderOutput,
  TiffPrepResult,
  TiffImportConfig,
  TiffAnalysisResult,
  TiffDialogCallback,
} from "../types";

function trimNull(xml: string | undefined): string | undefined {
  // trim trailing unicode zeros?
  return xml && xml.trim().replace(/\0/g, "").trim();
}

function getOME(xml: string | undefined): Record<string, any> | undefined {
  if (typeof xml !== "string") {
    return undefined;
  }

  const parser = new XMLParser({
    ignoreAttributes: false, // keep attributes like SizeT, SizeC
    attributeNamePrefix: "", // no @_ prefix — cleaner access
  });

  try {
    const parsed = parser.parse(xml);
    return parsed?.OME;
  } catch {
    return undefined;
  }
}
const defaultOMEDims: Partial<OMEDims> = {
  name: undefined,
  sizex: 0,
  sizey: 0,
  sizez: undefined,
  sizec: undefined,
  sizet: undefined,
  unit: undefined,
  pixeltype: undefined,
  dimensionorder: undefined,
  pixelsizex: undefined,
  pixelsizey: undefined,
  pixelsizez: undefined,
  channelnames: undefined,
};

function getOMEDims(imageObj: Record<string, any>): Partial<OMEDims> {
  const dims = { ...defaultOMEDims };
  const pixels = imageObj.Pixels;

  dims.name = imageObj.Name ?? "";
  dims.sizex = Number(pixels.SizeX);
  dims.sizey = Number(pixels.SizeY);
  dims.sizez = Number(pixels.SizeZ);
  dims.sizec = Number(pixels.SizeC);
  dims.sizet = Number(pixels.SizeT);
  dims.unit = pixels.PhysicalSizeXUnit ?? "";
  dims.pixeltype = pixels.Type ?? "";
  dims.dimensionorder = pixels.DimensionOrder ?? "xyzct";
  dims.pixelsizex = Number(pixels.PhysicalSizeX);
  dims.pixelsizey = Number(pixels.PhysicalSizeY);
  dims.pixelsizez = Number(pixels.PhysicalSizeZ);

  // Channel can be single object or array
  const channels = Array.isArray(pixels.Channel)
    ? pixels.Channel
    : pixels.Channel
      ? [pixels.Channel]
      : [];

  dims.channelnames = channels.map(
    (ch: { Name?: string; ID?: string }, i: number) =>
      ch.Name ?? ch.ID ?? `Channel${i}`,
  );

  return dims;
}

function getImageJDims(imageDescription: string): Partial<OMEDims> | undefined {
  const lines = imageDescription.split("\n");
  if (!lines[0].includes("ImageJ")) return undefined;
  const dims: Partial<OMEDims> = {};
  for (const line of lines) {
    const [key, val] = line.split("=");
    switch (key) {
      case "channels":
        dims.sizec = Number(val);
        break;
      case "slices":
        dims.sizez = Number(val);
        break;
      case "frames":
        dims.sizet = Number(val);
        break;
      case "unit":
        dims.unit = val;
        break;
    }
  }
  // A bare "ImageJ=..." header (as plain RGB tiffs carry) declares no axis —
  // return undefined so resolveDims falls through to the samples-per-pixel
  // fallback instead of treating this as authoritative.
  const foundAxis =
    dims.sizec !== undefined ||
    dims.sizez !== undefined ||
    dims.sizet !== undefined;
  return foundAxis ? dims : undefined;
}

export const tiffReader: IFileReader = {
  supportedTypes: [MIME.TIFF],
  async extract(input: ReaderInput): Promise<ReaderOutput> {
    if (!input.dimConfig) {
      throw new Error("TIFF extraction requires dimConfig");
    }

    const stack = await loadImageFromBuffer(input.fileData);
    return {
      stack,
      shape: {
        channels: input.dimConfig.channels,
        planes: input.dimConfig.slices,
        width: stack.getImage(0).width,
        height: stack.getImage(0).height,
      },
      dimConfig: input.dimConfig,
    };
  },
};

export async function prepareTiffConfigs(
  files: FileList,
  updateProgress: (args: { overallProgress: number }) => void,
  handleTiffDialog?: TiffDialogCallback,
): Promise<TiffPrepResult | null> {
  const { analyses, buffers } = await analyzeTiffs(files, updateProgress);

  // Index analyses by filename for quick lookup below
  const analysisByName = new Map(analyses.map((a) => [a.fileName, a]));

  const configs = new Map<string, TiffImportConfig>();

  // --- Dialog path (multi-frame files) ---
  const hasMultiframe = analyses.some((a) => a.isMultiFrame);
  if (hasMultiframe && handleTiffDialog) {
    const dialogResult = await handleTiffDialog(analyses);
    if (dialogResult === null) {
      return null; // user cancelled
    }
    // Merge dialog-provided configs
    for (const [fileName, config] of Object.entries(dialogResult)) {
      configs.set(fileName, config);
    }
  }

  // --- Fill in defaults for any file the dialog didn't cover ---
  // This handles: single-frame TIFFs, multi-frame TIFFs when no
  // dialog callback was provided, and any file the dialog skipped.
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i].name;
    if (configs.has(fileName)) continue;

    const analysis = analysisByName.get(fileName);
    const dims = analysis?.OMEDims;

    configs.set(fileName, {
      dimensionOrder: dims?.dimensionorder ?? "xyczt",
      channels: dims?.sizec ?? 1,
      slices: dims?.sizez ?? 1,
      frames: dims?.sizet ?? 1,
    });
  }

  return { configs, buffers };
}
/**
 * Analyze files without processing them
 * Used to determine if dialogs are needed (e.g., TIFF frame interpretation)
 *
 * 1. Check file types
 * 2. For TIFFs, parse header to detect frames
 * 3. Return analysis results for UI decisions
 */
async function analyzeTiffs(
  files: FileList,
  updateProgress: (args: { overallProgress: number }) => void,
): Promise<{
  analyses: TiffAnalysisResult[];
  buffers: Map<string, ArrayBuffer>;
  errors: Array<TaskError>;
}> {
  // Phase 1: Return basic analysis
  const results: TiffAnalysisResult[] = [];
  const buffers = new Map<string, ArrayBuffer>();
  const errors: Array<TaskError> = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    updateProgress({
      overallProgress: overallProgress("analyze", i / files.length),
    });

    try {
      const fileData = await file.arrayBuffer();
      buffers.set(file.name, fileData);

      const tiffResult = await analyzeTiff(fileData);

      results.push({ fileName: file.name, ...tiffResult });
    } catch {
      //if analysis fails, treat as regular image
      errors.push({
        source: file.name,
        error: new Error("Could not parse metadata, treating as regular image"),
        recoverable: true,
      });
    }
  }

  return { analyses: results, buffers, errors };
}

/**
 * Resolve C/Z/T dimensions from whatever metadata the TIFF carries.
 * Priority: OME-XML → ImageJ → JSON "shape" → packed-samples fallback.
 * Leaves dims undefined when the layout is genuinely ambiguous
 * (multiple IFDs, no metadata) so the dialog can ask the user.
 */
function resolveDims(
  description: string | undefined,
  image: GeoTIFFImage,
  samplesPerPixel: number,
): Partial<OMEDims> {
  // 1. OME-TIFF XML — authoritative for C/Z/T.
  const omeEl = getOME(description);
  if (omeEl !== undefined) {
    const image0El = Array.isArray(omeEl.Image) ? omeEl.Image[0] : omeEl.Image;
    return getOMEDims(image0El);
  }

  console.warn(
    "Could not read OME-TIFF metadata from file. Doing our best with base TIFF metadata.",
  );

  const dims: Partial<OMEDims> = { ...defaultOMEDims };
  dims.sizex = image.getWidth();
  dims.sizey = image.getHeight();

  // 2. ImageJ hyperstack metadata.
  if (typeof description === "string") {
    const imageJDims = getImageJDims(description);
    if (imageJDims) return { ...dims, ...imageJDims };
  }

  // 3. JSON "shape" descriptor: [t?, c?, z?, y, x].
  const shape = parseShape(description);
  if (shape) {
    dims.sizex = shape[shape.length - 1] ?? dims.sizex;
    dims.sizey = shape[shape.length - 2] ?? dims.sizey;
  }

  // 4. Packed multichannel with no metadata (e.g. a plain RGB): the samples
  //    ARE the channels, and a single packed IFD is one z / one t.
  //    Separate-IFD stacks (samplesPerPixel === 1, imageCount > 1) are left
  //    ambiguous on purpose — the dialog resolves how to split those planes.
  if (!dims.sizec && samplesPerPixel > 1) {
    dims.sizec = samplesPerPixel;
    dims.sizez = 1;
    dims.sizet = 1;
  }

  return dims;
}

function parseShape(description: string | undefined): number[] | undefined {
  if (typeof description !== "string") return undefined;
  try {
    const parsed = JSON.parse(description);
    if (parsed && Array.isArray(parsed.shape)) return parsed.shape as number[];
  } catch {
    // not JSON — ignore
  }
  return undefined;
}

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
export async function analyzeTiff(
  buffer: ArrayBuffer,
): Promise<AnalyzeTiffOutput> {
  try {
    const tiff = await fromArrayBuffer(buffer);
    const imageCount = await tiff.getImageCount();
    const image: GeoTIFFImage = await tiff.getImage();
    const samplesPerPixel = image.getSamplesPerPixel();

    // Total number of 2D single-channel planes the decoder will emit.
    // Channels can live in separate IFDs (samplesPerPixel === 1) or be packed
    // into one IFD (RGB, samplesPerPixel === 3); both normalise to this count.
    // INVARIANT: must match how the decoder (image-js) counts channels — it
    // splits packed IFDs assuming no alpha, so planeCount === decoded planes.
    const planeCount = imageCount * samplesPerPixel;

    const description = trimNull(
      (await image.getFileDirectory().loadValue("ImageDescription")) as
        | string
        | undefined,
    );

    return {
      frameCount: planeCount,
      isMultiFrame: planeCount > 1,
      OMEDims: resolveDims(description, image, samplesPerPixel),
      metadata: {},
    };
  } catch (error) {
    throw parseError(error);
  }
}
