import JSZip from "jszip";
import { KeyError } from "zarr";

import type { SerializedModels } from "utils/dl/types";

import type { ValidStoreType, AsyncStore } from "zarr/types/storage/types";

/**
 * Preserves (double) slashes earlier in the path, so this works better
 * for URLs. From https://stackoverflow.com/a/46427607/4178400
 * @param args parts of a path or URL to join.
 */
function joinUrlParts(...args: string[]) {
  return args
    .map((part, i) => {
      if (i === 0) return part.trim().replace(/[/]*$/g, "");
      return part.trim().replace(/(^[/]*|[/]*$)/g, "");
    })
    .filter((x) => x.length)
    .join("/");
}
class ReadOnlyStore {
  async keys() {
    return [];
  }

  async deleteItem() {
    return false;
  }

  async setItem() {
    console.warn("Cannot write to read-only store.");
    return false;
  }
}

export class FileStore
  extends ReadOnlyStore
  implements AsyncStore<ArrayBuffer>
{
  private _map: Map<string, File>;
  private _rootPrefix: string;
  private _rootName: string;

  constructor(fileMap: Map<string, File>, rootName: string, rootPrefix = "") {
    super();
    this._map = fileMap;
    this._rootPrefix = rootPrefix;
    this._rootName = rootName;
  }

  get rootName() {
    return this._rootName;
  }

  private _key(key: string) {
    return joinUrlParts(this._rootPrefix, key);
  }

  async getItem(key: string) {
    const file = this._map.get(this._key(key));
    if (!file) {
      throw new KeyError(key);
    }
    const buffer = await file.arrayBuffer();
    return buffer;
  }

  async containsItem(key: string) {
    const path = this._key(key);
    return this._map.has(path);
  }
}
export class ZipStore implements AsyncStore<ValidStoreType> {
  private _rootName: string;
  protected _zip: ReturnType<JSZip>;
  private _needsInitialGroup: boolean;

  constructor(name: string, zip?: JSZip) {
    this._rootName = `${name}.zarr`;
    this._zip = zip ? zip : new JSZip();
    this._zip.folder(this._rootName);
    this._needsInitialGroup = zip ? false : true;
  }

  async keys(): Promise<string[]> {
    return Object.values(this._zip.files)
      .filter((f) => !f.dir)
      .map((f) => f.name);
  }

  async getItem(key: string): Promise<ValidStoreType> {
    if (key === `${this._rootName}/.zgroup` && this._needsInitialGroup) {
      const initialGroup = JSON.stringify({ zarr_format: 2 });
      this._zip.file(key, initialGroup);
      return initialGroup;
    }
    const item = this._zip.file(key);
    if (!item) throw new Error(`No item with key ${key}`);
    return item.async("arraybuffer");
  }

  async containsItem(key: string) {
    return this._zip.file(key) !== null;
  }

  async setItem(item: string, value: ValidStoreType) {
    this._zip.file(item, value);
    return true;
  }

  async deleteItem(item: string) {
    this._zip.remove(item);
    return true;
  }

  get zip() {
    return this._zip;
  }
  get rootName() {
    return this._rootName;
  }
}
export type CustomStore = FileStore | ZipStore;

export class PiximiStore extends ZipStore {
  constructor(name: string, zip?: JSZip) {
    super(name, zip);
  }
  attachModels(modelsByName: SerializedModels) {
    Object.values(modelsByName).forEach((model) => {
      this._zip.file(model.modelJson.fileName, model.modelJson.blob);
      this._zip.file(model.modelWeights.fileName, model.modelWeights.blob);
    });
  }
}
