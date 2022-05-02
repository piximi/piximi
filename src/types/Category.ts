export type Category = {
  color: string;
  id: string;
  name: string;
  visible: boolean;
};

export const UNKNOWN_CATEGORY_ID: string =
  "00000000-0000-0000-0000-000000000000";

export const UNKNOWN_ANNOTATION_CATEGORY: Category = {
  color: "#920000",
  id: UNKNOWN_CATEGORY_ID,
  name: "Unknown",
  visible: true,
};
