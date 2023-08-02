import { KeyError } from "zarr";
import { AsyncStore } from "zarr/types/storage/types";

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
