import { INTENSITY_MEASUREMENTS } from "core/entities";
import { featureColumn, intensityColumn } from "core/backend";

import { parseChannelMeasurementLabel } from "./utils";

import type { Category, ChannelMeta } from "core/entities";
import type { MeasurementScope, MeasurementTable } from "core/backend";

import type {
  Dimension,
  ImageMeasurementGroup,
  MeasurementColumnRef,
  MeasurementRow,
  ObjectMeasurementGroup,
  ParsedMeasurementData,
} from "./types";

/* What a group's table covers. */
export const scopeOf = (
  group: ObjectMeasurementGroup | ImageMeasurementGroup,
): MeasurementScope =>
  "kind" in group
    ? { type: "objects", kindId: group.kind }
    : { type: "images" };

/*
 * The group's selected measurements as backend columns. Intensity labels
 * name a channel by its meta's name, so a renamed or missing meta leaves
 * its label without a column, as before it left it without a value.
 */
export const selectedColumns = (
  group: ObjectMeasurementGroup | ImageMeasurementGroup,
  channelMetas: ChannelMeta[],
): MeasurementColumnRef[] => {
  const refs: MeasurementColumnRef[] = [];
  if ("kind" in group) {
    for (const feature of group.featureMeasurements) {
      refs.push({ label: feature, key: featureColumn(feature) });
    }
  }
  for (const label of group.intensityMeasurements) {
    // The selection tree's parent nodes are stored alongside the leaves.
    if (
      label === "intensity" ||
      (INTENSITY_MEASUREMENTS as readonly string[]).includes(label)
    )
      continue;
    let parsed: ReturnType<typeof parseChannelMeasurementLabel>;
    try {
      parsed = parseChannelMeasurementLabel(label);
    } catch {
      continue;
    }
    const meta = channelMetas.find((m) => m.name === parsed.channelId);
    if (!meta) continue;
    refs.push({ label, key: intensityColumn(parsed.measurement, meta.id) });
  }
  return refs;
};

/* One table from the pages of another, in order. */
export const concatTables = (parts: MeasurementTable[]): MeasurementTable => {
  if (parts.length === 1) return parts[0];
  const [first] = parts;
  const values: MeasurementTable["values"] = {};
  for (const key of Object.keys(first.values)) {
    values[key] = parts.flatMap((part) => part.values[key] ?? []);
  }
  return {
    ids: parts.flatMap((part) => part.ids),
    imageIds: first.imageIds && parts.flatMap((part) => part.imageIds ?? []),
    imageNames: parts.flatMap((part) => part.imageNames),
    categoryIds: parts.flatMap((part) => part.categoryIds),
    partitions: parts.flatMap((part) => part.partitions),
    timepoints: parts.flatMap((part) => part.timepoints),
    boundingBoxes:
      first.boundingBoxes && parts.flatMap((part) => part.boundingBoxes ?? []),
    values,
    total: parts.at(-1)!.total,
  };
};

export const tableRows = (
  table: MeasurementTable,
  scope: MeasurementScope,
  categories: Record<string, Category | undefined>,
): MeasurementRow[] =>
  table.ids.map((id, index) => {
    const imageName = table.imageNames[index];
    return {
      id,
      index,
      name: scope.type === "objects" ? `${imageName}_${index}` : imageName,
      categoryId: table.categoryIds[index],
      categoryName: categories[table.categoryIds[index]]?.name ?? "",
      partition: table.partitions[index],
      imageId: table.imageIds?.[index] ?? id,
      imageName,
      timepoint: table.timepoints[index],
      boundingBox: table.boundingBoxes?.[index],
    };
  });

/* What the plots read: each row's selected measurements by label. */
export const plotDataOf = (
  rows: MeasurementRow[],
  columns: MeasurementColumnRef[],
  table: MeasurementTable,
  scope: MeasurementScope,
): ParsedMeasurementData => {
  const data: ParsedMeasurementData = {};
  for (const row of rows) {
    const measurements: Record<string, number> = {};
    for (const { label, key } of columns) {
      const value = table.values[key]?.[row.index];
      if (value !== null && value !== undefined) measurements[label] = value;
    }
    data[row.id] = {
      id: row.id,
      kind: scope.type === "objects" ? scope.kindId! : "Image",
      category: row.categoryName,
      partition: row.partition,
      timepoint: row.timepoint,
      preview: "",
      measurements,
    };
  }
  return data;
};

/* The splits the rows offer: category and partition always, then the
 * objects' images or the images' timepoints. */
export const dimensionsOf = (
  rows: MeasurementRow[],
  scope: MeasurementScope,
): Dimension[] => {
  const categories = new Map<string, string>();
  const partitions = new Set<string>();
  const images = new Map<string, string>();
  const timepoints = new Set<number>();
  for (const row of rows) {
    categories.set(row.categoryId, row.categoryName);
    partitions.add(row.partition);
    if (scope.type === "objects") images.set(row.imageId, row.imageName);
    else timepoints.add(row.timepoint);
  }
  const dimensions: Dimension[] = [
    {
      id: "category",
      label: "Category",
      values: [...categories].map(([id, label]) => ({
        id,
        label,
        parentId: "category",
      })),
    },
    {
      id: "partition",
      label: "Partition",
      values: [...partitions].map((id) => ({
        id,
        label: id,
        parentId: "partition",
      })),
    },
  ];
  if (images.size > 0) {
    dimensions.push({
      id: "image",
      label: "Image",
      values: [...images].map(([id, label]) => ({
        id,
        label,
        parentId: "image",
      })),
    });
  }
  if (timepoints.size > 0) {
    dimensions.push({
      id: "timepoint",
      label: "Timepoint",
      values: [...timepoints]
        .sort((a, b) => a - b)
        .map((t) => ({
          id: String(t),
          label: String(t),
          parentId: "timepoint",
        })),
    });
  }
  return dimensions;
};
