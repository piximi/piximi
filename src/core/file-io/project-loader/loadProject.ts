import JSZip from "jszip";
import { openGroup } from "zarr";
import { clean, eq, lt, lte, valid } from "semver";

import { MODEL_MANIFEST_FILENAME } from "core/file-io/consts";

import type { CancelToken } from "utils/workers/types";
import { logger } from "utils/logUtils";
import { recursiveAssign } from "utils/objectUtils";
import { computeObjectFeatures } from "utils/measurements/computeObjectFeatures";
import { computeObjectIntensityMeasurementsLocal } from "utils/measurements/computeObjectIntensityMeasurements";

import { FileStore, ZipStore } from "../zarr/stores";
import { getAttr } from "../zarr/utils";
import { readV2 } from "./version-readers/readV2";
import { readV11 } from "./version-readers/readV11";
import { convertV11ToV2 } from "./version-converters/v11ToV2";
import { readV02 } from "./version-readers/readV02";
import { convertV02ToV11 } from "./version-converters/v02Tov11";
import { readV01 } from "./version-readers/readV01";
import { convertV01ToV02 } from "./version-converters/v01Tov02";
import { subProgress } from "./progress";

import type { ExtractedModelFileMap } from "core/dl/types";
import type { CustomStore } from "../zarr/stores";
import type { LoadProjectInput, LoadProjectOutput } from "./types";
import type { V2PiximiState } from "./version-readers/version-types/v2Types";

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
      // Current format — no converter, what's on disk is what Redux consumes.
      v2 = await readV2(store, updateProgress);
      break;

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
  const annotations = v2.data.annotations.entities;
  const annotationList = Object.values(annotations);

  const objectFeatures = computeObjectFeatures(annotationList);
  Object.entries(objectFeatures).forEach(([id, features]) => {
    annotations[id].features = features;
  });

  const annotationsByPlane = annotationList.reduce<
    Record<string, typeof annotationList>
  >((acc, ann) => {
    (acc[ann.planeId] ??= []).push(ann);
    return acc;
  }, {});
  const channels = v2.data.channels.entities;
  const intensityMeasurementBatches = Object.entries(annotationsByPlane).map(
    ([planeId, objs]) => ({
      channelRefs: Object.values(channels).filter(
        (ch) => ch.planeId === planeId,
      ),
      objs,
    }),
  );

  const intensityMeasurements = await computeObjectIntensityMeasurementsLocal(
    intensityMeasurementBatches,
  );
  Object.entries(intensityMeasurements).forEach(([id, measurements]) => {
    annotations[id].intensityMeasurements = measurements;
  });
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

  const cleaned = clean(projectVersionRaw);
  if (!valid(cleaned) || lt(cleaned!, "0.1.0")) {
    throw new Error(`Unsupported project file version: ${projectVersionRaw}`);
  }

  const projectVersion = cleaned!;
  let versionRange: VersionRange;
  if (eq(projectVersion, "0.1.0")) {
    versionRange = "0.1.0";
  } else if (lte(projectVersion, "1.0.0")) {
    versionRange = "0.2-1.0";
  } else if (lt(projectVersion, "1.2.0")) {
    versionRange = "1.1";
  } else if (lt(projectVersion, "3.0.0")) {
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
/**
 * Minimal shape check for a model manifest.
 *
 * Deliberately not the zod `ManifestSchema` from `import/importFittedModel` —
 * that module pulls in `getClassifierApi`, and this file runs inside the load
 * worker. Only these three fields are needed to locate the files.
 */
const parseModelManifest = (
  text: string,
): {
  modelName: string;
  modelTopology: string;
  modelWeights: string;
} | null => {
  try {
    const parsed = JSON.parse(text);
    const { modelName, files } = parsed ?? {};
    if (
      typeof modelName !== "string" ||
      typeof files?.modelTopology !== "string" ||
      typeof files?.modelWeights !== "string"
    ) {
      return null;
    }
    return {
      modelName,
      modelTopology: files.modelTopology,
      modelWeights: files.modelWeights,
    };
  } catch {
    return null;
  }
};

/**
 * Locate models via the `piximi_manifest.json` written into each model folder.
 *
 * Manifest paths are relative to the manifest's own folder, which makes the
 * single-model export format (manifest at the archive root) the degenerate
 * case of the same rule.
 *
 * The `File` names come from the manifest rather than the zip entry path, so
 * they keep the basenames the topology's weightsManifest refers to — TF.js
 * matches weight files by basename and would otherwise reject them.
 */
const extractModelsFromManifests = async (
  zip: JSZip,
): Promise<ExtractedModelFileMap> => {
  const models: ExtractedModelFileMap = {};
  const manifestPattern = new RegExp(
    `(^|/)${MODEL_MANIFEST_FILENAME.replace(/\./g, "\\.")}$`,
  );

  for (const manifestEntry of zip.file(manifestPattern)) {
    const manifest = parseModelManifest(await manifestEntry.async("text"));
    if (!manifest) {
      logger(`Unreadable model manifest at ${manifestEntry.name}`, {
        level: "warn",
      });
      continue;
    }

    const dir = manifestEntry.name.slice(
      0,
      manifestEntry.name.lastIndexOf("/") + 1,
    );
    const topologyEntry = zip.file(dir + manifest.modelTopology);
    const weightsEntry = zip.file(dir + manifest.modelWeights);

    if (!topologyEntry || !weightsEntry) {
      logger(
        `Model "${manifest.modelName}" is missing ${
          !topologyEntry ? manifest.modelTopology : manifest.modelWeights
        }`,
        { level: "warn" },
      );
      continue;
    }

    models[manifest.modelName] = {
      modelJson: new File(
        [await topologyEntry.async("arraybuffer")],
        manifest.modelTopology,
        { type: "application/json" },
      ),
      modelWeights: new File(
        [await weightsEntry.async("arraybuffer")],
        manifest.modelWeights,
        { type: "application/octet-stream" },
      ),
    };
  }

  return models;
};

/**
 * Fallback for archives written before models carried manifests: recover the
 * name by splitting the filename on ".".
 *
 * Only reliable for single-model archives. Older multi-model archives named
 * every model's files with the same constants, so they were already lossy
 * before this path existed.
 */
const extractModelsByFileName = async (
  zip: JSZip,
): Promise<ExtractedModelFileMap> => {
  const modelFileRegEx = new RegExp(".json$|.weights.bin$");
  const models: ExtractedModelFileMap = {};
  for await (const [fileName, file] of Object.entries(zip.files)) {
    if (!modelFileRegEx.test(fileName)) continue;

    const parsedFileName = fileName.split(".");
    const modelName = parsedFileName[0];
    const extension = parsedFileName.at(1);

    const fileBuffer = await file.async("arraybuffer");
    if (extension === "json") {
      if (modelName in models && "modelJson" in models[modelName]) {
        logger(`Duplicate '.${extension}' file for ${modelName}`, {
          level: "warn",
        });
      }
      const modelFile = new File([fileBuffer], fileName, {
        type: "application/json",
      });
      recursiveAssign(models, {
        [modelName]: { modelJson: modelFile },
      });
    } else {
      const modelFile = new File([fileBuffer], fileName, {
        type: "application.octet-stream",
      });
      recursiveAssign(models, { [modelName]: { modelWeights: modelFile } });
    }
  }
  return models;
};

const extractModelsFromZip = async (
  zip: JSZip,
): Promise<ExtractedModelFileMap> => {
  const fromManifests = await extractModelsFromManifests(zip);
  if (Object.keys(fromManifests).length > 0) return fromManifests;
  return extractModelsByFileName(zip);
};
async function createStoreFromZip(
  file: File,
): Promise<{ store: CustomStore; modelFiles: ExtractedModelFileMap }> {
  const zip = await new JSZip().loadAsync(file);
  const rootFile = zip.folder(/.*\.zarr\/$/);

  if (rootFile.length !== 1) {
    throw new Error("Could not determine zarr root in project file");
  }

  const fileName = rootFile[0].name.split(".")[0];

  const modelFiles = await extractModelsFromZip(zip);
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
