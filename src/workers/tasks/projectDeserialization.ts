/**
 * Worker adapter for project deserialization.
 *
 * Creates a ProjectSerializationService instance and wires its callbacks
 * to TensorStorageService for IndexedDB storage.
 */
import { ProjectSerializer } from "services/dataPipeline/projectSerialization";
import { TensorStorageService, STORES } from "services/tensorStorage";
import { StoreName, TensorReference } from "services/tensorStorage/types";
import { RawSerializedData } from "services/dataPipeline/projectSerialization/types";
import {
  CancelToken,
  DeserializeProjectInput,
  DeserializeProjectOutput,
} from "../scheduler/types";
import { PipelineProgress } from "services/dataPipeline/types";

export async function deserializeProject(
  input: DeserializeProjectInput,
  cancelToken: CancelToken,
  onProgress: (value: number | Partial<PipelineProgress>) => void,
): Promise<DeserializeProjectOutput> {
  const serializer = new ProjectSerializer();
  const storage = TensorStorageService.getInstance();

  async function storeEntity(
    raw: RawSerializedData,
    storeName: StoreName,
  ): Promise<TensorReference> {
    if (cancelToken.cancelled) {
      throw new DOMException("Task cancelled", "AbortError");
    }
    const storageResult = await storage.store(
      raw.id,
      {
        buffer: raw.buffer,
        dtype: raw.dtype,
        shape: raw.shape,
        preparedChannels: raw.preparedChannels,
        renderedSrc: raw.renderedSrc,
      },
      storeName,
    );

    if (!storageResult.success) {
      throw new Error(
        `Failed to store tensor ${raw.id} in ${storeName}: ${storageResult.error.message}`,
      );
    }
    return storageResult.data;
  }

  const result = await serializer.deserialize<TensorReference>(
    input.files,
    {
      onImage: (raw) => storeEntity(raw, STORES.IMAGE_TENSORS),
      onAnnotation: (raw) => storeEntity(raw, STORES.ANNOTATION_TENSORS),
    },
    onProgress,
  );

  return {
    project: result.project,
    classifier: result.classifier,
    segmenter: result.segmenter,
    images: result.images.map((img) => ({
      ...img,
      tensorRef: img.ref,
    })),
    annotations: result.annotations.map((ann) => ({
      ...ann,
      tensorRef: ann.ref,
    })),
    categories: Object.fromEntries(result.categories.map((c) => [c.id, c])),
    kinds: Object.fromEntries(result.kinds.map((k) => [k.id, k])),
    metadata: result.metadata,
    modelFiles: result.modelFiles,
  };
}
