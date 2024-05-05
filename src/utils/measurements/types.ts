export interface TreeItemData {
  id: string;
  name: string;
  children?: readonly string[];
  parent?: string;
}

export type TreeData = Record<string, TreeItemData>;
