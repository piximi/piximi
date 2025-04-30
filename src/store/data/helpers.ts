import { v4 as uuidv4 } from "uuid";
import { union } from "lodash";

import {
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "./constants";

import { Category, Kind } from "./types";

export const generateUUID = (options?: { definesUnknown: boolean }) => {
  const id = uuidv4();
  let unknownFlag: string;
  if (options?.definesUnknown) {
    unknownFlag = "0";
  } else {
    unknownFlag = "1";
  }
  return unknownFlag + id.slice(1);
};

export const isUnknownCategory = (categoryId: string) => {
  return categoryId[0] === "0";
};

export const generateUnknownCategory = (kind: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: Category = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    containing: [],
    kind: kind,
    visible: true,
  };
  return unknownCategory;
};

export const generateCategory = (
  name: string,
  kindId: string,
  color: string,
) => {
  const id = generateUUID();
  return {
    name,
    id,
    kind: kindId,
    color,
    containing: [],
    visible: true,
  } as Category;
};

export const generateKind = (kindName: string, useUUID?: boolean) => {
  const kindId = useUUID ? generateUUID() : kindName;
  const unknownCategory = generateUnknownCategory(kindId);
  const kind: Kind = {
    id: kindId,
    displayName: kindName,
    categories: [unknownCategory.id],
    unknownCategoryId: unknownCategory.id,
    containing: [],
  };
  return { kind, unknownCategory };
};

export const updateContents = (
  previousContents: string[],
  contents: string[],
  updateType: "add" | "remove" | "replace",
) => {
  let newContents: string[];

  switch (updateType) {
    case "add":
      newContents = union(previousContents, contents);
      break;
    case "remove":
      newContents = previousContents.filter((a) => !contents.includes(a));
      break;
    case "replace":
      newContents = contents;
  }
  return newContents;
};
