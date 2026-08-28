import { v4 as uuidv4 } from "uuid";

import {
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_NAME,
  UNKNOWN_KIND_CATEGORY_ID,
  UNKNOWN_IMAGE_CATEGORY_ID,
  UNKNOWN_KIND_ID,
} from "./constants";

import type {
  AnnotationCategory,
  Category,
  Channel,
  ChannelMeta,
  FeatureKey,
  Kind,
} from "./types";

const RESERVED_IDS = new Set([
  UNKNOWN_IMAGE_CATEGORY_ID,
  UNKNOWN_KIND_ID,
  UNKNOWN_KIND_CATEGORY_ID,
]);
function* _uuidStream(definesUnknown: boolean) {
  const flag = definesUnknown ? "0" : "1";
  while (true) yield flag + uuidv4().slice(1);
}
/*
 * Generates a new UUID whilce preventing collision with predefined IDs
 * Though chances of collision are astronamically small without the guard,
 * better safe than sorry!
 */
export const generateUUID = (options?: { definesUnknown: boolean }) => {
  for (const id of _uuidStream(options?.definesUnknown ?? false)) {
    if (!RESERVED_IDS.has(id)) return id;
  }
  /*
  TypeScript doesn't know the generator is infinite, so it assumes
  for...of could end without hitting return, resulting in the return
  type of the function being `string | undefined`. The idiomatic fix 
  is an unreachable throw after the loop
  */
  throw new Error("unreachable");
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

const generateUnknownAnnotationCategory = (kindId: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: AnnotationCategory = {
    id: unknownCategoryId,
    name: UNKNOWN_NAME,
    color: UNKNOWN_ANNOTATION_CATEGORY_COLOR,
    type: "annotation",
    kindId,
    isUnknown: true,
  };
  return unknownCategory;
};

export const generateCategory = (
  name: string,
  color: string,
  spec: { type: "image" } | { type: "annotation"; kindId: string },
) => {
  const id = generateUUID();
  return {
    name,
    id,
    color,
    isUnknown: false,
    ...spec,
  } as Category;
};

export const generateKind = (
  kindName: string,
): { kind: Kind; unknownCategory: AnnotationCategory } => {
  const kindId = generateUUID();
  const unknownCategory = generateUnknownAnnotationCategory(kindId);
  const kind: Kind = {
    id: kindId,
    name: kindName,
    unknownCategoryId: unknownCategory.id,
  };
  return { kind, unknownCategory };
};

export const OBJ_MEAS_LOOKUP: Record<FeatureKey, string> = {
  area: "Area",
  bboxArea: "Bounding Box Area",
  comX: "Center of Mass (X)",
  comY: "Center of Mass (Y)",
  compactness: "Compactness",
  eqpc: "Diameter of a circle of equal projection area ",
  extent: "Extent",
  ped: "Diameter of a circle of equal perimeter",
  perimeter: "Perimeter",
  sphericity: "Sphericity",
  radius: "Radius of a circle of equal perimeter",
};

export const INTENSE_MEAS_LOOKUP = {
  total: "Sum of pixel intensities",
  min: "Minimum intensity",
  max: "Maximum intensity",
  mean: "Mean intensity",
  median: "Median intensity",
  std: "Standard deviation",
  mad: "Median Absolute Deviation",
  lowerQuartile: "Pixel which 25% of values are lower",
  upperQuartile: "Pixel which 25% of values are higher",
};
