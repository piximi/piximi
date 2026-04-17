import { CancelToken } from "utils/worker-scheduler/types";
import { LoadProjectInput, LoadProjectOutput } from "./types";
import { CustomStore, FileStore, ZipStore } from "utils/file-io/zarr/stores";
import { ExtractedModelFileMap } from "utils/models/types";
import JSZip from "jszip";
import classifierHandler from "utils/models/classification/classifierHandler";
import { openGroup } from "zarr";
import { getAttr } from "./zarr/utils";
import semver from "semver";
import { readV11 } from "./version-readers/readV11";
import { convertV11ToV2 } from "./version-converters/v11ToV2";
import { readV02 } from "./version-readers/readV02";
import { convertV02ToV11 } from "./version-converters/v02Tov11";
import { readV01 } from "./version-readers/readV01";
import { convertV01ToV02 } from "./version-converters/v01Tov02";
import { V2PiximiState } from "./version-readers/version-types/v2Types";
import { subProgress } from "./progress";

type VersionRange = "0.1.0" | "0.2-1.0" | "1.1" | "2" | "3+";

export async function loadProject(
  input: LoadProjectInput,
  cancelToken: CancelToken,
  onProgress: ({ value }: { value: number }) => void,
): Promise<LoadProjectOutput> {
  const { store, modelFiles } = await openStore(input.files);
  const { projectVersion, versionRange } = await detectVersion(store);
  let v2: V2PiximiState;
  const updateProgress = (p: number) => onProgress({ value: p });
  switch (versionRange) {
    case "2":
      throw new Error("Version 2 reader not yet implemented");

    case "1.1": {
      const v11 = await readV11(
        store,
        subProgress(updateProgress, { start: 0, end: 0.5 }),
      );
      v2 = convertV11ToV2(
        v11,
        subProgress(updateProgress, { start: 0.5, end: 1 }),
      );
      break;
    }

    case "0.2-1.0": {
      const v02 = await readV02(
        store,
        subProgress(updateProgress, { start: 0, end: 0.2 }),
      );
      const v11 = convertV02ToV11(
        v02,
        subProgress(updateProgress, { start: 0.3, end: 0.4 }),
      );
      v2 = convertV11ToV2(
        v11,
        subProgress(updateProgress, { start: 0.4, end: 1 }),
      );
      break;
    }

    case "0.1.0": {
      const v01 = await readV01(
        store,
        subProgress(updateProgress, { start: 0, end: 0.15 }),
      );
      const v02 = convertV01ToV02(
        v01,
        subProgress(updateProgress, { start: 0.15, end: 0.35 }),
      );
      const v11 = convertV02ToV11(
        v02,
        subProgress(updateProgress, { start: 0.35, end: 0.15 }),
      );
      v2 = convertV11ToV2(
        v11,
        subProgress(updateProgress, { start: 0.5, end: 1 }),
      );
      break;
    }

    default:
      throw new Error(`Unsupported version: ${projectVersion}`);
  }
  return { project: v2, modelFiles };
}

async function detectVersion(
  store: CustomStore,
): Promise<{ projectVersion: string; versionRange: VersionRange }> {
  const rootGroup = await openGroup(store, store.rootName, "r");
  const projectVersionRaw = (await getAttr(rootGroup, "version")) as string;

  if (!projectVersionRaw) {
    throw new Error("No version field found in project file.");
  }

  const cleaned = semver.clean(projectVersionRaw);
  if (!semver.valid(cleaned) || semver.lt(cleaned!, "0.1.0")) {
    throw new Error(`Unsupported project file version: ${projectVersionRaw}`);
  }

  const projectVersion = cleaned!;
  let versionRange: VersionRange;
  if (semver.eq(projectVersion, "0.1.0")) {
    versionRange = "0.1.0";
  } else if (semver.lte(projectVersion, "1.0.0")) {
    versionRange = "0.2-1.0";
  } else if (semver.lt(projectVersion, "1.2.0")) {
    versionRange = "1.1";
  } else if (semver.lt(projectVersion, "3.0.0")) {
    versionRange = "2";
  } else {
    versionRange = "3+";
  }
  return { projectVersion, versionRange };
}
async function openStore(
  files: File[],
): Promise<{ store: CustomStore; modelFiles: ExtractedModelFileMap }> {
  if (files.length === 1 && files[0].type === "application/zip") {
    return createStoreFromZip(files[0]);
  }
  return createStoreFromFileList(files);
}
async function createStoreFromZip(
  file: File,
): Promise<{ store: CustomStore; modelFiles: ExtractedModelFileMap }> {
  const zip = await new JSZip().loadAsync(file);
  const rootFile = zip.folder(/.*\.zarr\/$/);

  if (rootFile.length !== 1) {
    throw new Error("Could not determine zarr root in project file");
  }

  const fileName = rootFile[0].name.split(".")[0];

  const modelFiles = await classifierHandler.extractModelsFromZip(zip);
  return {
    store: new ZipStore(fileName, zip),
    modelFiles,
  };
}
async function createStoreFromFileList(
  files: File[],
): Promise<{ store: CustomStore; modelFiles: ExtractedModelFileMap }> {
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
  return { store: new FileStore(fMap, rootName), modelFiles: {} };
}
