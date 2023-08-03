import JSZip from "jszip";
import { KeyError } from "zarr";
import { AsyncStore, ValidStoreType } from "zarr/types/storage/types";

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

  public static fListToStore(files: FileList) {
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
  private _name: string;
  private _zip: ReturnType<JSZip>;

  private createGroup() {
    return JSON.stringify({ zarr_format: 2 });
  }

  constructor(name: string) {
    this._name = `${name}.zarr`;
    this._zip = new JSZip();
    this._zip.folder(this._name);
  }

  async keys(): Promise<string[]> {
    // TODO -zarr: not sure if this is correct
    // currently all files with full path
    return Object.values(this._zip.files)
      .filter((f) => !f.dir)
      .map((f) => f.name);
  }

  // TODO - zarr
  async getItem(key: string): Promise<ValidStoreType> {
    if (key === `${this._name}/.zgroup`) {
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
    return this._zip.file(`${this._name}/${key}`) !== null;
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

  get name() {
    return this._name;
  }

  // listDir?: (path?: string) => Promise<string[]>;
  //  rmDir?: (path?: string) => Promise<boolean>;

  //  getSize?: (path?: string) => Promise<number>;
  //  rename?: (path?: string) => Promise<void>;
}
