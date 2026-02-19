import JSZip from "jszip";
import { openGroup } from "zarr";
import semver from "semver";
import { tensor4d } from "@tensorflow/tfjs";

import { getAttr } from "./zarr/utils";

import { readV01, readV02, readV11, readV12 } from "./readers";

import { convertV01ToV02 } from "./converters/v01ToV02";
import { convertV02ToV11 } from "./converters/v02ToV11";
import { convertV11ToV12 } from "./converters/v11ToV12";

import {
  prepareChannels,
  renderPreview,
  tensorToBuffer,
} from "workers/scheduler/imageProcessing";
import { generateBlankColors } from "utils/tensorUtils";

import {
  DeserializationCallbacks,
  DeserializedProjectResult,
  RawDeserializedImage,
  RawDeserializedAnnotation,
  IProjectSerializer,
} from "./types";

import { ZipStore, CustomStore, FileStore } from "utils/file-io/zarr/stores";
import {
  V12RawAnnotationObject,
  V12RawImageObject,
  V12PiximiState,
} from "./readers/version-types/v12Types";
import classifierHandler from "utils/models/classification/classifierHandler";
import { ExtractedModelFileMap } from "utils/models/types";
import { PipelineProgress } from "../types";

type VersionRange = "0.1.0" | "0.2-1.0" | "1.1" | "1.2+";

/**
 * ProjectSerializationService
 *
 * Pure, stateless service for reading/writing Piximi's Zarr-based project format.
 * No IndexedDB, no Redux, no singletons — only knows about the Zarr format.
 *
 * Side effects (tensor storage) are delegated to callbacks provided by the caller.
 * This makes the service testable, reusable, and decoupled from storage concerns.
 *
 * Usage:
 *   const serializer = new ProjectSerializationService();
 *   const result = await serializer.deserialize(buffer, {
 *     onImage: async (rawData) => { store in IndexedDB; return tensorRef; },
 *     onAnnotation: async (rawData) => { store in IndexedDB; return tensorRef; },
 *   }, onProgress);
 */
export class ProjectSerializer implements IProjectSerializer {
  private piximiVersion: string | null = null;
  private versionRange: VersionRange | null = null;

  // ============================================================
  // Deserialization (project file → structured data)
  // ============================================================

  async deserialize<TRef>(
    files: File[],
    callbacks: DeserializationCallbacks<TRef>,
    onProgress: (progress: number | Partial<PipelineProgress>) => void,
  ): Promise<DeserializedProjectResult<TRef>> {
    onProgress({ currentFile: "unzipping", stageProgress: 0 });
    // 1. Parse ZIP → ZipStore
    const { store, modelFiles } = await this.openStore(files);
    onProgress({ currentFile: "unzipping", stageProgress: 100 });

    onProgress({
      currentFile: "detecting-version",
      stageProgress: 0,
      overallProgress: 6,
    });
    // 2. Detect version
    await this.detectVersion(store);
    onProgress({
      currentFile: "detecting-version",
      stageProgress: 100,
      overallProgress: 11,
    });

    onProgress({
      currentFile: "deserializing-project",
      stageProgress: 0,
      overallProgress: 11,
    });
    // 4. Read + convert → V12RawProject
    const v12Raw = await this.readAndConvert(store, onProgress);
    onProgress({
      currentFile: "deserializing-project",
      stageProgress: 100,
      overallProgress: 50,
    });
    // 5. Process tensors and apply callbacks
    const result = await this.processAndCallback(v12Raw, callbacks, onProgress);
    onProgress(95);

    return { ...result, modelFiles };
  }

  // ============================================================
  // Version Detection
  // ============================================================

  private async detectVersion(store: CustomStore): Promise<void> {
    const rootGroup = await openGroup(store, store.rootName, "r");
    const piximiVersionRaw = (await getAttr(rootGroup, "version")) as string;

    if (!piximiVersionRaw) {
      throw new Error("No version field found in project file.");
    }

    const cleaned = semver.clean(piximiVersionRaw);
    if (!semver.valid(cleaned) || semver.lt(cleaned!, "0.1.0")) {
      throw new Error(`Unsupported project file version: ${piximiVersionRaw}`);
    }

    this.piximiVersion = cleaned!;

    if (semver.eq(cleaned!, "0.1.0")) {
      this.versionRange = "0.1.0";
    } else if (semver.lte(cleaned!, "1.0.0")) {
      this.versionRange = "0.2-1.0";
    } else if (semver.lt(cleaned!, "1.2.0")) {
      this.versionRange = "1.1";
    } else {
      this.versionRange = "1.2+";
    }
  }

  // ============================================================
  // Read + Convert Pipeline
  // ============================================================

  private async readAndConvert(
    store: CustomStore,
    onProgress: (progress: number | Partial<PipelineProgress>) => void,
  ): Promise<V12PiximiState> {
    switch (this.versionRange) {
      case "1.2+":
        return readV12(store, (p: number) => {
          onProgress({
            stageProgress: p,
            overallProgress: 11 + Math.floor(p * 0.5),
          });
        });

      case "1.1": {
        const v11 = await readV11(store, (p: number) => {
          onProgress({
            stageProgress: p,
            overallProgress: 11 + Math.floor(p * 0.45),
          });
        });
        const v12 = convertV11ToV12(v11);
        onProgress({ overallProgress: 50 });
        return v12;
      }

      case "0.2-1.0": {
        const v02 = await readV02(store, (p: number) => {
          onProgress({
            stageProgress: p,
            overallProgress: 11 + Math.floor(p * 0.4),
          });
        });
        const v11 = convertV02ToV11(v02);
        onProgress({ overallProgress: 45 });
        const v12 = convertV11ToV12(v11);
        onProgress({ overallProgress: 50 });
        return v12;
      }

      case "0.1.0": {
        const v01 = await readV01(store, (p: number) => {
          onProgress({
            stageProgress: p,
            overallProgress: 11 + Math.floor(p * 0.35),
          });
        });
        const v02 = convertV01ToV02(v01);
        onProgress({ overallProgress: 40 });
        const v11 = convertV02ToV11(v02);
        onProgress({ overallProgress: 45 });
        const v12 = convertV11ToV12(v11);
        onProgress({ overallProgress: 50 });
        return v12;
      }

      default:
        throw new Error(`Unsupported version: ${this.piximiVersion}`);
    }
  }

  // ============================================================
  // Tensor Processing + Callback Application
  // ============================================================

  /**
   * After the converter chain produces V12RawProject (with raw ArrayBuffers),
   * this method:
   * 1. Creates temporary Tensor4D from each buffer
   * 2. Prepares channels + renders preview
   * 3. Calls the storage callback (onImage/onAnnotation)
   * 4. Disposes the temporary tensor
   * 5. Returns metadata + refs
   */
  private async processAndCallback<TRef>(
    v12Raw: V12PiximiState,
    callbacks: DeserializationCallbacks<TRef>,
    onProgress: (progress: number | Partial<PipelineProgress>) => void,
  ): Promise<Omit<DeserializedProjectResult<TRef>, "modelFiles">> {
    const { data } = v12Raw;
    const totalImages = data.images.length;
    const totalAnnotations = data.annotations.length;
    const totalEntities = totalImages + totalAnnotations;
    let entitiesCounted = 0;

    // --- Process Images ---
    onProgress({
      currentFile: "Processing images",
      stageProgress: 0,
      overallProgress: 50,
      processedCount: 0,
      totalCount: totalImages,
    });
    const images: DeserializedProjectResult<TRef>["images"] = [];

    let i = 0;
    for (const img of data.images) {
      const rawForCallback = await this.processImageTensor(img);
      const ref = await callbacks.onImage(rawForCallback);

      images.push({
        id: img.id,
        name: img.name,
        metadataId: img.metadataId,
        colors: img.colors,
        categoryId: img.categoryId,
        activePlane: img.activePlane,
        partition: img.partition,
        timepoint: img.timepoint,
        ref,
      });

      i++;
      entitiesCounted++;
      onProgress({
        currentFile: "Processing images",
        stageProgress: Math.floor((entitiesCounted / totalEntities) * 100),
        overallProgress:
          50 + Math.floor((entitiesCounted / totalEntities) * 45),
        processedCount: i,
        totalCount: totalImages,
      });
    }

    // --- Process Annotations ---
    onProgress({
      currentFile: "Processing annotations",
      processedCount: 0,
      totalCount: totalAnnotations,
    });
    const annotations: DeserializedProjectResult<TRef>["annotations"] = [];
    i = 0;
    for (const ann of data.annotations) {
      const rawForCallback = await this.processAnnotationTensor(ann);
      const ref = await callbacks.onAnnotation(rawForCallback);

      annotations.push({
        id: ann.id,
        name: ann.name,
        kind: ann.kind,
        bitDepth: ann.bitDepth,
        partition: ann.partition,
        boundingBox: ann.boundingBox,
        encodedMask: ann.encodedMask,
        plane: ann.plane,
        imageId: ann.imageId,
        timepoint: ann.timepoint,
        categoryId: ann.categoryId,
        shape: ann.shape,
        activePlane: ann.activePlane,
        childIds: ann.childIds,
        ref,
      });

      i++;
      entitiesCounted++;
      onProgress({
        currentFile: "Processing annotations",
        stageProgress: Math.floor((entitiesCounted / totalEntities) * 100),
        overallProgress:
          50 + Math.floor((entitiesCounted / totalEntities) * 45),
        processedCount: i,
        totalCount: totalAnnotations,
      });
    }

    return {
      project: v12Raw.project,
      classifier: v12Raw.classifier,
      segmenter: v12Raw.segmenter,
      images,
      annotations,
      categories: data.categories,
      kinds: data.kinds,
      metadata: data.metadata,
    };
  }

  /**
   * Process a single image's raw buffer into the callback-ready format.
   * Creates a temporary tensor, prepares channels, renders preview, disposes.
   */
  private async processImageTensor(
    img: V12RawImageObject,
  ): Promise<RawDeserializedImage> {
    const { tensorData, ...meta } = img;
    const typedArray = new Float32Array(tensorData.buffer);
    const tensor = tensor4d(typedArray, tensorData.shape, "float32");

    const preparedChannels = prepareChannels(tensor);
    const { buffer, dtype } = tensorToBuffer(tensor);
    const renderedSrc = await renderPreview(
      tensor,
      img.colors,
      img.activePlane,
      /* bitDepth — need from metadata lookup */ 8,
      tensorData.shape[3], // channels
    );

    tensor.dispose();

    return {
      ...meta,
      buffer,
      dtype,
      shape: tensorData.shape,
      preparedChannels,
      renderedSrc,
    };
  }

  /**
   * Process a single annotation's raw buffer.
   */
  private async processAnnotationTensor(
    ann: V12RawAnnotationObject,
  ): Promise<RawDeserializedAnnotation> {
    const { tensorData, ...meta } = ann;
    const typedArray = new Float32Array(tensorData.buffer);
    const tensor = tensor4d(typedArray, tensorData.shape, "float32");

    const colors = generateBlankColors(tensorData.shape[3]);
    const preparedChannels = prepareChannels(tensor);
    const { buffer, dtype } = tensorToBuffer(tensor);
    const renderedSrc = await renderPreview(
      tensor,
      colors,
      ann.activePlane ?? 0,
      ann.bitDepth,
      tensorData.shape[3],
    );

    tensor.dispose();

    return {
      ...meta,
      buffer,
      dtype,
      shape: tensorData.shape,
      preparedChannels,
      renderedSrc,
    };
  }
  // ============================================================
  // ZIP Handling
  // ============================================================

  private async openStore(
    files: File[],
  ): Promise<{ store: CustomStore; modelFiles: ExtractedModelFileMap }> {
    if (files.length === 1 && files[0].type === "application/zip") {
      return this.createStoreFromZip(files[0]);
    }
    return this.createStoreFromFileList(files);
  }
  private async createStoreFromZip(
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
  private async createStoreFromFileList(
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
}
