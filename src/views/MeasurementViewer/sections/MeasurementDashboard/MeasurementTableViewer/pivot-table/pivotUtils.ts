import type { GridColDef, GridColumnGroup } from "@mui/x-data-grid";

import type {
  ExtendedAnnotationObject,
  ExtendedImageObject,
  Category,
} from "store/data/types";

import { computeStatistics } from "utils/measurements/statistics";

import type {
  ImageEntityMeasurementGroup,
  ObjectEntityMeasurementGroup,
  PivotItem,
} from "@MeasurementViewer/types";

// ============================================================================
// TYPES
// ============================================================================

type PivotRowData = {
  id: string;
  measurement: string;
  [key: string]: string | number; // Dynamic columns for pivot combinations
};

type PivotAggregation = {
  count: number;
  mean: number;
  median: number;
  std: number;
};

export type EntityWithMeasurements =
  | ExtendedAnnotationObject
  | ExtendedImageObject;

// ============================================================================
// COMPOSITE KEY GENERATION
// ============================================================================

/**
 * Generates a composite key from an entity based on the pivot configuration.
 * For example, if pivotItems = [category: "Cell", partition: "Training"],
 * this returns "Cell|Training" for entities matching those values.
 */
const generateCompositeKey = (
  entity: EntityWithMeasurements,
  pivotItems: PivotItem[],
  categories: Record<string, Category>,
): string | null => {
  const keyParts: string[] = [];

  for (const pivotItem of pivotItems) {
    if (pivotItem.isMainDimension) {
      // Main dimension - use all values (this entity's value for that dimension)
      const value = getEntityDimensionValue(entity, pivotItem.id, categories);
      if (value === null) return null;
      keyParts.push(value);
    } else {
      // Specific value - check if entity matches this specific value
      const entityValue = getEntityDimensionValue(
        entity,
        pivotItem.parentId!,
        categories,
      );
      const expectedValue = pivotItem.label;
      if (entityValue !== expectedValue) return null;
      keyParts.push(expectedValue);
    }
  }

  return keyParts.length > 0 ? keyParts.join("|") : "all";
};

/**
 * Gets the value of a dimension for an entity.
 */
const getEntityDimensionValue = (
  entity: EntityWithMeasurements,
  dimensionId: string,
  categories: Record<string, Category>,
): string | null => {
  switch (dimensionId) {
    case "category":
      return categories[entity.categoryId]?.name ?? null;
    case "partition":
      return entity.partition;
    case "imageId":
      // ImageObject uses its own id, AnnotationObject has imageId field
      return "imageId" in entity ? entity.imageId : entity.id;
    case "timepoint":
      // For time-series support
      return "timepoint" in entity && entity.timepoint !== undefined
        ? String(entity.timepoint)
        : null;
    case "tracklet":
      // For tracking support
      return "trackId" in entity && entity.trackId
        ? String(entity.trackId)
        : null;
    default:
      return null;
  }
};

// ============================================================================
// COLUMN GENERATION
// ============================================================================

/**
 * Generates unique composite keys based on pivot configuration and entities.
 */
export const generateUniqueCompositeKeys = (
  entities: EntityWithMeasurements[],
  pivotItems: PivotItem[],
  categories: Record<string, Category>,
): string[] => {
  if (pivotItems.length === 0) {
    return ["all"];
  }

  const uniqueKeys = new Set<string>();

  entities.forEach((entity) => {
    const key = generateCompositeKey(entity, pivotItems, categories);
    if (key) {
      uniqueKeys.add(key);
    }
  });

  return Array.from(uniqueKeys).sort();
};

/**
 * Creates dynamic columns based on pivot configuration.
 * Returns both flat columns and nested column grouping model for hierarchical headers.
 *
 * For example, with pivotItems = [Category (all), Partition (all)] and
 * compositeKeys = ["Cell|Training", "Cell|Validation", "Nucleus|Training", "Nucleus|Validation"],
 * this creates:
 *
 * Cell                              | Nucleus
 * ├─ Training      | Validation     | ├─ Training      | Validation
 * │  Count Mean... | Count Mean...  | │  Count Mean... | Count Mean...
 */
export const generatePivotColumns = (
  pivotItems: PivotItem[],
  compositeKeys: string[],
): { columns: GridColDef[]; columnGroupingModel: GridColumnGroup[] } => {
  const statisticFields = ["count", "mean", "median", "std"] as const;
  const statisticLabels: Record<(typeof statisticFields)[number], string> = {
    count: "Count",
    mean: "Mean",
    median: "Median",
    std: "Std Dev",
  };

  // Base column for measurement name
  const measurementColumn: GridColDef = {
    field: "measurement",
    headerName: "Measurement",
    headerAlign: "center",
    align: "left",
    minWidth: 150,
    editable: false,
    flex: 1,
  };

  // If no pivot items, return simple columns
  if (pivotItems.length === 0 || compositeKeys.length === 0) {
    const defaultColumns: GridColDef[] = [
      measurementColumn,
      ...statisticFields.map(
        (stat): GridColDef => ({
          field: `all_${stat}`,
          headerName: statisticLabels[stat],
          headerAlign: "center",
          align: "center",
          minWidth: stat === "std" ? 100 : 80,
          editable: false,
          flex: 1,
          valueFormatter: (value: number) =>
            stat === "count" ? String(value) : formatStatValue(value),
        }),
      ),
    ];
    return { columns: defaultColumns, columnGroupingModel: [] };
  }

  // Generate flat columns for each composite key (these are the leaf columns)
  const pivotColumns: GridColDef[] = [];

  compositeKeys.forEach((compositeKey) => {
    statisticFields.forEach((stat) => {
      const fieldName = `${compositeKey}_${stat}`;

      pivotColumns.push({
        field: fieldName,
        headerName: statisticLabels[stat],
        headerAlign: "center",
        align: "center",
        minWidth: stat === "std" ? 100 : 80,
        editable: false,
        flex: 1,
        valueFormatter: (value: number) =>
          stat === "count" ? String(value ?? 0) : formatStatValue(value),
      });
    });
  });

  // Build nested column grouping model
  const columnGroupingModel = buildNestedColumnGroups(
    pivotItems,
    compositeKeys,
    statisticFields as unknown as string[],
  );

  return {
    columns: [measurementColumn, ...pivotColumns],
    columnGroupingModel,
  };
};

/**
 * Builds a nested column group hierarchy based on pivot items.
 *
 * For pivot depth of 2 (e.g., Category → Partition):
 * - Level 0 groups by first pivot item values (e.g., "Cell", "Nucleus")
 * - Level 1 groups by second pivot item values (e.g., "Training", "Validation")
 * - Leaf level contains statistic columns
 */
const buildNestedColumnGroups = (
  pivotItems: PivotItem[],
  compositeKeys: string[],
  statisticFields: string[],
): GridColumnGroup[] => {
  const pivotDepth = pivotItems.length;

  if (pivotDepth === 0) return [];

  // Parse composite keys into structured data
  // e.g., "Cell|Training" → ["Cell", "Training"]
  const parsedKeys = compositeKeys.map((key) => ({
    key,
    parts: key.split("|"),
  }));

  // Build the tree recursively
  return buildGroupLevel(parsedKeys, pivotItems, 0, statisticFields);
};

/**
 * Recursively builds column groups at each level of the pivot hierarchy.
 */
const buildGroupLevel = (
  parsedKeys: { key: string; parts: string[] }[],
  pivotItems: PivotItem[],
  level: number,
  statisticFields: string[],
): GridColumnGroup[] => {
  const pivotDepth = pivotItems.length;

  // Get unique values at this level
  const uniqueValuesAtLevel = [
    ...new Set(parsedKeys.map((pk) => pk.parts[level])),
  ].sort();

  return uniqueValuesAtLevel.map((value) => {
    // Filter keys that match this value at the current level
    const matchingKeys = parsedKeys.filter((pk) => pk.parts[level] === value);

    // Create a unique group ID based on the path so far
    const groupIdParts = matchingKeys[0].parts.slice(0, level + 1);
    const groupId = `group_${groupIdParts.join("_")}`;

    // If this is the deepest pivot level, children are statistic column fields
    if (level === pivotDepth - 1) {
      // Create children that reference the actual field names
      const children: GridColumnGroup["children"] = matchingKeys.flatMap((pk) =>
        statisticFields.map((stat) => ({ field: `${pk.key}_${stat}` })),
      );

      return {
        groupId,
        headerName: value,
        headerAlign: "center" as const,
        children,
      };
    }

    // Otherwise, recurse to build nested groups - include full group objects
    const nestedGroups = buildGroupLevel(
      matchingKeys,
      pivotItems,
      level + 1,
      statisticFields,
    );

    return {
      groupId,
      headerName: value,
      headerAlign: "center" as const,
      children: nestedGroups as GridColumnGroup["children"],
    };
  });
};

const formatStatValue = (value: number | undefined): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return value.toFixed(2);
};

// ============================================================================
// ROW AGGREGATION
// ============================================================================

/**
 * Aggregates measurement values by composite key.
 */
const aggregateByPivot = (
  entities: EntityWithMeasurements[],
  measurementKey: string,
  getMeasurementValue: (entity: EntityWithMeasurements) => number | undefined,
  pivotItems: PivotItem[],
  categories: Record<string, Category>,
  compositeKeys: string[],
): Record<string, PivotAggregation> => {
  // Initialize buckets for each composite key
  const buckets: Record<string, number[]> = {};
  compositeKeys.forEach((key) => {
    buckets[key] = [];
  });

  // Populate buckets
  entities.forEach((entity) => {
    const value = getMeasurementValue(entity);
    if (value === undefined || typeof value !== "number") return;

    if (pivotItems.length === 0) {
      buckets["all"].push(value);
    } else {
      const key = generateCompositeKey(entity, pivotItems, categories);
      if (key && buckets[key]) {
        buckets[key].push(value);
      }
    }
  });

  // Calculate statistics for each bucket
  const result: Record<string, PivotAggregation> = {};

  Object.entries(buckets).forEach(([key, values]) => {
    if (values.length === 0) {
      result[key] = { count: 0, mean: NaN, median: NaN, std: NaN };
    } else {
      const { mean, median, std } = computeStatistics(values);
      result[key] = { count: values.length, mean, median, std };
    }
  });

  return result;
};

// ============================================================================
// ROW GENERATION
// ============================================================================

export type MeasurementGetter = {
  key: string;
  label: string;
  getValue: (entity: EntityWithMeasurements) => number | undefined;
};

/**
 * Generates pivot table rows from entity group and pivot configuration.
 */
export const generatePivotRows = (
  activeEntityGroup: ImageEntityMeasurementGroup | ObjectEntityMeasurementGroup,
  categories: Record<string, Category>,
  pivotItems: PivotItem[],
  measurementGetters: MeasurementGetter[],
): PivotRowData[] => {
  const entities = activeEntityGroup.entities;
  const compositeKeys = generateUniqueCompositeKeys(
    entities,
    pivotItems,
    categories,
  );

  const rows: PivotRowData[] = [];

  measurementGetters.forEach((getter, idx) => {
    const aggregations = aggregateByPivot(
      entities,
      getter.key,
      getter.getValue,
      pivotItems,
      categories,
      compositeKeys,
    );

    // Build row with dynamic columns
    const row: PivotRowData = {
      id: `row-${idx}`,
      measurement: getter.label,
    };

    Object.entries(aggregations).forEach(([compositeKey, stats]) => {
      row[`${compositeKey}_count`] = stats.count;
      row[`${compositeKey}_mean`] = stats.mean;
      row[`${compositeKey}_median`] = stats.median;
      row[`${compositeKey}_std`] = stats.std;
    });

    rows.push(row);
  });

  return rows;
};
