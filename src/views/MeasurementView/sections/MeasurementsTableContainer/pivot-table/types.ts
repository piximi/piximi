export const DIMENSION_TYPE = "PIVOT_DIMENSION";

export type DimensionDragItem = {
  type: typeof DIMENSION_TYPE;
  id: string;
  label: string;
  sourceZone: "available" | "columns" | "rows";
};
