import { Group, ZarrArray } from "zarr";
import { RawArray } from "zarr/types/rawArray";

export const getDataset = async (root: Group, key: string) => {
  const dataset = await root.getItem(key);

  if (dataset instanceof ZarrArray) {
    return dataset as ZarrArray;
  } else {
    throw Error(`Expected dataset "${key}" in group "${root.path}"`);
  }
};

export const getDatasetSelection = async (
  root: Group,
  key: string,
  selection: Array<number | null>,
) => {
  const dataset = await root.getItem(key);

  if (dataset instanceof ZarrArray) {
    const rawData = await dataset.getRaw(selection);
    return rawData as RawArray;
  } else {
    throw Error(`Expected dataset "${key}" in group "${root.path}"`);
  }
};

export const getAttr = async (root: Group | ZarrArray, attr: string) => {
  const validAttr = await root.attrs.containsItem(attr);

  if (validAttr) {
    const attrValue = await root.attrs.getItem(attr);
    return attrValue;
  } else {
    throw Error(`Expected attribute "${attr}" in group "${root.path}"`);
  }
};

export const getGroup = async (root: Group, key: string) => {
  const group = await root.getItem(key);

  if (group instanceof Group) {
    return group as Group;
  } else {
    throw Error(
      `Expected key "${key}" of type "Group" in group "${root.path}"`,
    );
  }
};
