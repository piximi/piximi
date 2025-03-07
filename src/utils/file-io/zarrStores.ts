import JSZip from "jszip";
import { KeyError } from "zarr";
import { AsyncStore, ValidStoreType } from "zarr/types/storage/types";
import { Kind } from "store/data/types";

export type SerializedModels = Record<
  Kind["id"],
  Array<{
    modelJson: { blob: Blob; fileName: string };
    modelWeights: { blob: Blob; fileName: string };
  }>
>;

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

  private createGroup() {
    return JSON.stringify({ zarr_format: 2 });
  }

  constructor(name: string, zip?: JSZip) {
    this._rootName = name;
    this._rootName = `${name}.zarr`;
    this._zip = zip ? zip : new JSZip();
    this._zip.folder(this._rootName);
    this._needsInitialGroup = zip ? false : true;
  }

  async keys(): Promise<string[]> {
    // TODO -zarr: not sure if this is correct
    // currently all files with full path
    return Object.values(this._zip.files)
      .filter((f) => !f.dir)
      .map((f) => f.name);
  }

  async getItem(key: string): Promise<ValidStoreType> {
    // This is to cover the case where we're using the store to write
    // and zarr.js expects .zgroup to be present at the root group
    // before attempting to write it
    if (key === `${this._rootName}/.zgroup` && this._needsInitialGroup) {
      const initialGroup = this.createGroup();
      this._zip.file(key, initialGroup);
      return initialGroup;
    }
    const item = this._zip.file(key);

    if (!item) {
      throw new Error(`No item with key ${key}`);
    }

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

  // listDir?: (path?: string) => Promise<string[]>;
  //  rmDir?: (path?: string) => Promise<boolean>;

  //  getSize?: (path?: string) => Promise<number>;
  //  rename?: (path?: string) => Promise<void>;
}

export class PiximiStore extends ZipStore {
  constructor(name: string, zip?: JSZip) {
    super(name, zip);
  }
  attachModels(modelsByKind: SerializedModels) {
    Object.values(modelsByKind).forEach((models) => {
      models.forEach((model) => {
        this._zip.file(model.modelJson.fileName, model.modelJson.blob);
        this._zip.file(model.modelWeights.fileName, model.modelWeights.blob);
      });
    });
  }
}

export type CustomStore = FileStore | ZipStore;

export const fListToStore = async (
  files: FileList | PseudoFileList,
  zipFile: boolean,
): Promise<CustomStore> => {
  if (zipFile) {
    const file = files[0];
    const zip = await new JSZip().loadAsync(file);
    // find folder of pattern "projectName.zarr/"
    const rootFile = zip.folder(/.*\.zarr\/$/);

    if (rootFile.length !== 1) {
      throw new Error("Could not determine zarr root");
    }

    // "projectName.zarr/" -> "projectName"
    const fileName = rootFile[0].name.split(".")[0];

    return new ZipStore(fileName, zip);
  } else {
    const rootName = files[0].webkitRelativePath.split("/")[0];

    /*
     * You can't randomly access files from a directory by path name
     * without the Native File System API, so we need to get objects for _all_
     * the files right away for Zarr. This is unfortunate because we need to iterate
     * over all File objects and create an in-memory index.
     *
     * fMap is simple key-value mapping from 'some/file/path' -> File
     */
    const fMap: Map<string, File> = new Map();

    for (const file of files) {
      if (file.name === ".DS_Store") continue;
      // TODO: check browser compat with webkitRelativePath vs path
      fMap.set(file.webkitRelativePath, file);
    }

    return new FileStore(fMap, rootName);
  }
};

export class PseudoFileList {
  private _files: File[];

  constructor(files: File[]) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._files = files;

    return new Proxy(this, {
      get(target, prop) {
        if (!isNaN(Number(prop)) && !(prop in target)) {
          return self._files[Number(prop)];
        } else {
          return Reflect.get(target, prop);
        }
      },
      // @ts-ignore only sort of satisfies FileList
    }) satisfies FileList;
  }

  public item(elem: number) {
    return this._files[elem];
  }

  public get length() {
    return this._files.length;
  }

  [key: number]: File;

  [Symbol.iterator](): IterableIterator<File> {
    return this._files[Symbol.iterator]();
  }
}
