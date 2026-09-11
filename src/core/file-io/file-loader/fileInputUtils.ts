import {
  FILE,
  MIME,
  type FileAnalysisResult,
  type FileInterpretationResult,
  type FileType,
  type MimeType,
} from "./types";

import type JSZip from "jszip";

import type { Channel, ChannelMeta } from "core/entities";

export const interpretFiles = (files: FileList): FileInterpretationResult => {
  // Phase 1: Return basic analysis
  const results: FileInterpretationResult["fileResults"] = {};
  const imageTypeSet = new Set<FileType>();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const mimeType = inferMimeType(file);
    const imageType = inferImageType(file.name);
    imageTypeSet.add(imageType);
    if (imageTypeSet.size > 1) {
      throw new Error(
        `Input files must be of the same type. Found ${imageTypeSet.entries}`,
      );
    }

    const result: FileAnalysisResult = {
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      imageType,
    };

    // For TIFF files, analyze in worker to detect multi-frame

    results[file.name] = result;
  }

  return { imageType: [...imageTypeSet][0], fileResults: results };
};

const inferMimeType = (file: File): MimeType => {
  const type = file.type;
  if ((Object.values(MIME) as string[]).includes(type)) {
    return type as MimeType;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return MIME.PNG;
    case "jpg":
    case "jpeg":
      return MIME.JPEG;
    case "heic":
      return MIME.HEIC;
    case "tif":
    case "tiff":
      return MIME.TIFF;
    case "dcm":
      return MIME.DICOM;
    case "bmp":
      return MIME.BMP;
    case "czi":
      return MIME.CZI;
    default:
      return MIME.UNKNOWN;
  }
};

const inferImageType = (fileName: string): FileType => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "tif" || ext === "tiff") return FILE.TIFF;
  if (ext === "dcm") return FILE.DICOM;
  if (ext === "czi") return FILE.CZI;
  return FILE.BASIC;
};

export const zipInputToBuffer = async (
  input: JSZip | File | Blob | ArrayBuffer,
): Promise<ArrayBuffer> => {
  if (input instanceof ArrayBuffer) return input;
  if (input instanceof Blob) return input.arrayBuffer();
  // JSZip
  return (input as JSZip).generateAsync({ type: "arraybuffer" });
};

const DEFAULT_CHANNEL_NAME_RE = /^Channel-\d+$/;
const isDefaultChannelName = (name: string): boolean =>
  DEFAULT_CHANNEL_NAME_RE.test(name);

/*
 * Match one series' incoming channel metas (index-ordered, length C) to the
 * canonical project-wide metas. Real (non-default) names like "DAPI" match by
 * name first; whatever is left over matches positionally among the remaining
 * canonical slots. Returns a map of incoming-meta-id -> canonical meta.
 */
const matchSeriesMetas = (
  canonical: ChannelMeta[],
  incoming: ChannelMeta[],
): Map<string, ChannelMeta> => {
  const map = new Map<string, ChannelMeta>();
  const taken = new Set<ChannelMeta>();

  incoming.forEach((inc) => {
    if (isDefaultChannelName(inc.name)) return;
    const hit = canonical.find((c) => !taken.has(c) && c.name === inc.name);
    if (hit) {
      map.set(inc.id, hit);
      taken.add(hit);
    }
  });

  const leftover = canonical.filter((c) => !taken.has(c));
  let li = 0;
  incoming.forEach((inc) => {
    if (!map.has(inc.id)) map.set(inc.id, leftover[li++]);
  });

  return map;
};

type ChannelMetaReconciliation = {
  metasToAdd: ChannelMeta[];
  metaUpdates: Array<{
    id: string;
    changes: Pick<
      ChannelMeta,
      "minValue" | "maxValue" | "rampMinLimit" | "rampMaxLimit"
    >;
  }>;
  channels: Channel[];
};

/*
 * ChannelMetas are shared project-wide: at most one per channel index. Given the
 * metas/channels produced for one or more freshly-loaded series (each set
 * index-ordered, length `channelCount`), reconcile them against the metas that
 * already exist in the project:
 *   - fresh project (no existing metas): the first series defines the canonical
 *     set; batch-wide min/max are folded in and the metas are returned to add.
 *   - existing project: incoming channels are remapped onto the existing metas
 *     (matched by name, then index) and the global min/max limits are widened;
 *     no new metas are added.
 * In both cases the returned `channels` have their channelMetaId pointed at the
 * shared meta. min/max limits are merged globally; display fields (colorMap,
 * rampMin/rampMax, visible, name) on existing metas are left untouched.
 */
export const reconcileChannelMetas = (
  existing: ChannelMeta[],
  incomingMetas: ChannelMeta[],
  incomingChannels: Channel[],
  channelCount: number,
): ChannelMetaReconciliation => {
  const C = channelCount;
  const fresh = existing.length === 0;
  const canonical = fresh ? incomingMetas.slice(0, C) : existing;

  const idToCanonical = new Map<string, ChannelMeta>();
  for (let start = 0; start < incomingMetas.length; start += C) {
    matchSeriesMetas(canonical, incomingMetas.slice(start, start + C)).forEach(
      (target, incomingId) => idToCanonical.set(incomingId, target),
    );
  }

  const merged = new Map<string, ChannelMeta>(
    canonical.map((c) => [c.id, { ...c }]),
  );
  incomingMetas.forEach((inc) => {
    const target = merged.get(idToCanonical.get(inc.id)!.id)!;
    target.minValue = Math.min(target.minValue, inc.minValue);
    target.maxValue = Math.max(target.maxValue, inc.maxValue);
    target.rampMinLimit = Math.min(target.rampMinLimit, inc.rampMinLimit);
    target.rampMaxLimit = Math.max(target.rampMaxLimit, inc.rampMaxLimit);
  });

  const channels = incomingChannels.map((ch) => ({
    ...ch,
    channelMetaId: idToCanonical.get(ch.channelMetaId)!.id,
  }));
  const mergedCanonical = canonical.map((c) => merged.get(c.id)!);

  if (fresh) {
    return { metasToAdd: mergedCanonical, metaUpdates: [], channels };
  }

  return {
    metasToAdd: [],
    metaUpdates: mergedCanonical.map((c) => ({
      id: c.id,
      changes: {
        minValue: c.minValue,
        maxValue: c.maxValue,
        rampMinLimit: c.rampMinLimit,
        rampMaxLimit: c.rampMaxLimit,
      },
    })),
    channels,
  };
};
