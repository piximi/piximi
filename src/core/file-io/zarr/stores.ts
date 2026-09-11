import JSZip from "jszip";

import {
  MANIFEST_VERSION,
  MODEL_MANIFEST_FILENAME,
  MODELS_DIRNAME,
} from "core/file-io/consts";

import { unescapePath } from "./paths";

import type { AbsolutePath, AsyncReadable, AsyncWritable } from "zarrita";

import type { SerializedModels } from "core/dl/types";

/**
 * Named here so a rename upstream is a one-file change, and so the readers
 * don't each have to spell out zarrita's storage generics.
 */
export type ReadStore = AsyncReadable;
export type WriteStore = AsyncReadable & AsyncWritable;

/**
 * Translate a zarr path into a zip/file-map key.
 *
 * zarrita keys are absolute (`/data/channels/zarr.json`) while JSZip entries
 * and `webkitRelativePath` values are relative, and every Piximi node lives
 * under `<name>.zarr/`. Rebasing here rather than making every caller pass a
 * root path is what lets the readers open with a bare `zarr.open(store, …)`,
 * and it keeps the user-supplied project name out of the zarr hierarchy
 * entirely.
 *
 * `unescapePath` reverses the substitution `./paths` applies to characters that
 * zarrita's URL-based resolver cannot carry. See that module for why.
 */
const entryName = (rootName: string, key: AbsolutePath): string =>
  unescapePath(`${rootName}${key}`);

/**
 * Read-only store over the `Map` a `webkitdirectory` upload produces.
 *
 * Note `rootName` here already carries the ".zarr" suffix — it comes from the
 * uploaded folder name (`files[0].webkitRelativePath.split("/")[0]`), unlike
 * `ZipStore`, which appends it. Preserved rather than unified, because both
 * sides are load-bearing at their call sites.
 */
export class FileStore implements ReadStore {
  constructor(
    private _map: Map<string, File>,
    private _rootName: string,
  ) {}

  async get(key: AbsolutePath): Promise<Uint8Array | undefined> {
    const file = this._map.get(entryName(this._rootName, key));
    // zarrita signals absence with `undefined`; there is no KeyError.
    if (!file) return undefined;
    return new Uint8Array(await file.arrayBuffer());
  }

  /** For diagnostics only — zarr paths no longer carry the root name. */
  get rootName() {
    return this._rootName;
  }
}

export class ZipStore implements ReadStore, AsyncWritable {
  private _rootName: string;
  protected _zip: JSZip;

  constructor(name: string, zip?: JSZip) {
    this._rootName = `${name}.zarr`;
    this._zip = zip ?? new JSZip();
    // `createStoreFromZip` recovers the root with `zip.folder(/.*\.zarr\/$/)`,
    // so the folder entry has to exist independently of what gets written into
    // it.
    this._zip.folder(this._rootName);
  }

  async get(key: AbsolutePath): Promise<Uint8Array | undefined> {
    const entry = this._zip.file(entryName(this._rootName, key));
    if (!entry) return undefined;
    return entry.async("uint8array");
  }

  async set(key: AbsolutePath, value: Uint8Array): Promise<void> {
    // JSZip takes a Uint8Array directly, so writes need no conversion.
    this._zip.file(entryName(this._rootName, key), value);
  }

  get zip() {
    return this._zip;
  }

  /** For diagnostics only — zarr paths no longer carry the root name. */
  get rootName() {
    return this._rootName;
  }
}

export type CustomStore = FileStore | ZipStore;

/**
 * Model names become directory names, so strip path separators. Dots go too:
 * a model called "foo.zarr" would otherwise produce `models/foo.zarr/`, which
 * `createStoreFromZip`'s `zip.folder(/.*\.zarr\/$/)` would count as a second
 * zarr root and reject the archive.
 *
 * The unmangled name is preserved in the manifest, which is what the loader
 * restores from — this only has to be a safe path segment, not reversible.
 */
const sanitizeModelDirName = (name: string) => name.replace(/[./\\]/g, "_");

export class PiximiStore extends ZipStore {
  constructor(name: string, zip?: JSZip) {
    super(name, zip);
  }

  /**
   * Write each model into `models/<name>/`, beside the `.zarr` folder.
   *
   * The files keep their canonical `model.json` / `model.weights.bin` names.
   * That is load-bearing: `Model.getSavedModelFiles` writes
   * `paths: ["./model.weights.bin"]` into the topology's weightsManifest, and
   * TF.js resolves weight files by basename, so renaming the file to
   * disambiguate models makes it unloadable. The folder does the
   * disambiguating instead.
   *
   * Each folder also gets a `piximi_manifest.json` describing its contents, so
   * the loader can recover the model's real name and file roles without
   * parsing filenames.
   */
  attachModels(modelsByName: SerializedModels) {
    Object.entries(modelsByName).forEach(([modelName, model]) => {
      const dir = `${MODELS_DIRNAME}/${sanitizeModelDirName(modelName)}`;
      const manifest = {
        formatVersion: MANIFEST_VERSION,
        savedAt: new Date().toISOString(),
        modelName,
        // Relative to this manifest's own folder.
        files: {
          modelTopology: model.modelJson.fileName,
          modelWeights: model.modelWeights.fileName,
        },
      };

      this._zip.file(
        `${dir}/${MODEL_MANIFEST_FILENAME}`,
        JSON.stringify(manifest),
      );
      this._zip.file(
        `${dir}/${model.modelJson.fileName}`,
        model.modelJson.blob,
      );
      this._zip.file(
        `${dir}/${model.modelWeights.fileName}`,
        model.modelWeights.blob,
      );
    });
  }
}
