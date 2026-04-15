import JSZip from "jszip";
import { ValidStoreType } from "zarr/types/storage/types";
import { AsyncStore } from "zarr/types/storage/types";

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
