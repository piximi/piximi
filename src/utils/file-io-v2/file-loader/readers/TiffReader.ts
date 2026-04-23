import { fromArrayBuffer } from "geotiff";
import { XMLParser } from "fast-xml-parser";

import { parseError } from "utils/logUtils";

import { loadImageFromBuffer } from "../imageReaderUtils";
import { MIME } from "../types";

import type { GeoTIFFImage } from "geotiff";
import type {
  OMEDims,
  AnalyzeTiffOutput,
  IFileReader,
  ReaderInput,
  ReaderOutput,
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
  const splitDescription = imageDescription.split("\n");

  if (splitDescription[0].includes("ImageJ")) {
    const dims = { ...defaultOMEDims };
    splitDescription.forEach((detail) => {
      const [key, val] = detail.split("=");
      switch (key) {
        case "channels":
          dims.sizec = Number(val);
          break;
        case "slices":
          dims.sizez = Number(val);
          break;
        case "unit":
          dims.unit = val;
          break;
        default:
          break;
      }
    });
    return dims;
  }
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
  let output: AnalyzeTiffOutput;
  try {
    const tiff = await fromArrayBuffer(buffer);
    const imageCount = await tiff.getImageCount();
    const image: GeoTIFFImage = await tiff.getImage();

    const tiffFileDirectory = image.getFileDirectory();
    const image0DescriptionRaw: string = (await tiffFileDirectory.loadValue(
      "ImageDescription",
    )) as string;

    // Get rid of null terminator, if it's there (`JSON.parse` doesn't know what to do with it)
    const image0Description = trimNull(image0DescriptionRaw);
    const omeEl = getOME(image0Description);
    let dims: Partial<OMEDims>;
    if (omeEl !== undefined) {
      const image0El = Array.isArray(omeEl.Image)
        ? omeEl.Image[0]
        : omeEl.Image;
      dims = getOMEDims(image0El);
      output = {
        frameCount: imageCount,
        isMultiFrame: true,
        OMEDims: dims,
        metadata: {},
      };
    } else {
      console.warn(
        "Could not read OME-TIFF metadata from file. Doing our best with base TIFF metadata.",
      );
      dims = defaultOMEDims;
      let shape: number[] = [];
      if (typeof image0Description === "string") {
        try {
          const imageJDims = getImageJDims(image0Description);
          if (imageJDims) dims = imageJDims;
          else {
            const parsed = JSON.parse(image0Description);
            if ("shape" in parsed) {
              shape = parsed.shape as number[];
            }
          }

          // if (Array.isArray(description.shape)) {
          //   shape = description.shape;
          // }
        } catch (_e) {
          console.warn("Could not parse image description: ", _e);
        }
      }

      // if `ImageDescription` is valid JSON with a `shape` field, we expect it to be an array of [t?, c?, z?, y, x].
      dims.sizex = shape[shape.length - 1] ?? image.getWidth();
      dims.sizey = shape[shape.length - 2] ?? image.getHeight();
      if (imageCount > 1) {
        output = {
          frameCount: imageCount,
          isMultiFrame: true,
          OMEDims: dims,
          metadata: {},
        };
      } else {
        output = {
          frameCount: imageCount,
          isMultiFrame: false,
          metadata: { ...dims },
        };
      }
    }
  } catch (error) {
    throw parseError(error);
  }
  return output;
}
