import { version_core } from "@tensorflow/tfjs";

import { Partition, generateUUID, representsUnknown } from "core/entities";
import { TaskCancelledError, isTaskCancelledError } from "core/dl/cancel";
import {
  ARCHITECTURE_IDS,
  ModelArch,
  modelArchOf,
} from "core/dl/classification/types";
import {
  classifierFromDTO,
  defaultClassifier,
} from "core/dl/classification/utils";
import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";
import { toInferenceInput, toTrainingInput } from "core/dl/utils";
import { buildClassifierZip } from "core/file-io/export/exportFittedModel";
import { importFittedModelFromZip } from "core/file-io/import/importFittedModel";

import { classifierSlice } from "store/classifier";
import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";
import { dataSlice } from "store/data";
import {
  selectAllCategories,
  selectExtendedAnnotationsByKindId,
  selectExtendedImages,
} from "store/data/selectors";

import { BackendError } from "../errors";
import {
  fingerprintItems,
  hashCategorySet,
  splitForTraining,
} from "../classification";
import { imageUpdate, volumeUpdate } from "./updates";

import type { Logs } from "@tensorflow/tfjs";

import type {
  Category,
  ExtendedAnnotationObject,
  ExtendedImageObject,
} from "core/entities";
import type { ErrorReason } from "core/dl/types";
import type {
  Classifier,
  IClassifierApi,
  ModelClassMap,
  Run,
  RunTrigger,
  EvaluationResult,
} from "core/dl/classification/types";

import type { EventBus } from "../events";
import type { JobRegistry } from "../jobs";
import type {
  AnnotationUpdate,
  BackendClassification,
  CallOptions,
  Changed,
  ClassifierCreateRequest,
  ClassifierExport,
  ClassifierFitRequest,
  ClassifierFitSummary,
  ClassifierImportRequest,
  ClassifierPredictRequest,
  ClassifierPredictSummary,
  ClassifierUpdateRequest,
  ModelDescriptor,
} from "../types";
import type { StoreHandle } from "./store";

type Deps = {
  store: StoreHandle;
  /* Resolved on first use so constructing the backend spawns no workers. */
  classifier: () => IClassifierApi;
  jobs: JobRegistry;
  bus: EventBus;
};

type Item = ExtendedImageObject | ExtendedAnnotationObject;

const toBackendError = (reason: ErrorReason) =>
  new BackendError(reason.code, reason.message, { cause: reason.cause });

const unwrap = <T>(
  result: { success: true; data: T } | { success: false; reason: ErrorReason },
): T => {
  if (!result.success) throw toBackendError(result.reason);
  return result.data;
};

const ensure = (
  result: { success: true } | { success: false; reason: ErrorReason },
): void => {
  if (!result.success) throw toBackendError(result.reason);
};

/* The architectures the in-browser worker can build. */
const ARCHITECTURES: ModelDescriptor[] = [
  {
    name: ARCHITECTURE_IDS[ModelArch.SIMPLE_CNN],
    displayName: "Simple CNN",
    description:
      "Two convolution and pooling blocks ahead of a dense softmax layer; small and quick to train",
    use: "A first classifier for any images, trained from scratch",
    sources: [],
    modelLoaded: false,
    status: "ready",
    framework: "tensorflow.js",
    version: version_core,
    tasks: ["classification", "classification.train"],
    channelPolicy: { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 16 },
    cancellableLoad: false,
  },
  {
    name: ARCHITECTURE_IDS[ModelArch.MOBILE_NET],
    displayName: "MobileNet",
    description:
      "MobileNet v1 with ImageNet weights and a new top layer; fine-tuned on the project",
    use: "RGB images that resemble photographs",
    sources: [
      {
        text: "MobileNet",
        url: "https://github.com/tensorflow/tfjs-models/tree/master/mobilenet",
      },
    ],
    modelLoaded: false,
    status: "ready",
    framework: "tensorflow.js",
    version: version_core,
    tasks: ["classification", "classification.train"],
    channelPolicy: { mode: CHANNEL_MODE.FIXED, count: 3 },
    cancellableLoad: false,
  },
];

/* What the run record wants to know about the optimizer between runs. */
const optimizerChanged = (
  previous: Run["hyperparameters"]["optimizer"] | undefined,
  current: Run["hyperparameters"]["optimizer"],
): boolean =>
  !!previous &&
  (previous.optimizationAlgorithm !== current.optimizationAlgorithm ||
    previous.learningRate !== current.learningRate);

/*
 * Classification on the in-browser tfjs worker, including everything the
 * fit and predict hooks used to do on the main thread: choosing and
 * partitioning the items, keeping the run record, writing predictions back
 * and announcing all of it. The classifier slice is the local truth for the
 * records, as the data slice is for the project.
 */
export class LocalClassification implements BackendClassification {
  readonly #deps: Deps;

  constructor(deps: Deps) {
    this.#deps = deps;
  }

  // ── Records ────────────────────────────────────────────────────────────────

  #records(): Classifier[] {
    const { kindClassifiers } = this.#deps.store.getState().classifier;
    return Object.values(kindClassifiers).flatMap((kc) =>
      Object.values(kc.modelInfoDict),
    );
  }

  #record(classifierId: string): Classifier {
    const record = this.#records().find((c) => c.id === classifierId);
    if (!record) {
      throw new BackendError(
        "MODEL_NOT_FOUND",
        `No classifier ${classifierId}`,
      );
    }
    return record;
  }

  #write(record: Classifier): Classifier {
    this.#deps.store.dispatch(classifierSlice.actions.upsertClassifier(record));
    this.#announce();
    return record;
  }

  #announce(): void {
    this.#deps.bus.emit({
      type: "classifiers/didChange",
      classifiers: this.#records(),
    });
  }

  // ── Items of a target ──────────────────────────────────────────────────────

  #items(targetId: string): Item[] {
    const state = this.#deps.store.getState();
    return targetId === IMAGE_CLASSIFIER_ID
      ? selectExtendedImages(state)
      : selectExtendedAnnotationsByKindId(state, targetId);
  }

  /* The target's categories other than unknown, in project order. */
  #knownCategories(targetId: string): Category[] {
    return selectAllCategories(this.#deps.store.getState()).filter(
      (category) =>
        !representsUnknown(category.id) &&
        (targetId === IMAGE_CLASSIFIER_ID
          ? category.type === "image"
          : category.type === "annotation" && category.kindId === targetId),
    );
  }

  #unknownCategoryId(targetId: string): string {
    const unknown = selectAllCategories(this.#deps.store.getState()).find(
      (category) =>
        representsUnknown(category.id) &&
        (targetId === IMAGE_CLASSIFIER_ID
          ? category.type === "image"
          : category.type === "annotation" && category.kindId === targetId),
    );
    if (!unknown) {
      throw new BackendError(
        "NOT_FOUND",
        `No unknown category for ${targetId}`,
      );
    }
    return unknown.id;
  }

  /* Writes partitions and announces them. */
  #assignPartitions(
    targetId: string,
    assignments: Array<{ id: string; partition: Partition }>,
  ): void {
    if (assignments.length === 0) return;
    const { store, bus } = this.#deps;
    if (targetId === IMAGE_CLASSIFIER_ID) {
      store.dispatch(dataSlice.actions.batchUpdateImagePartition(assignments));
      const images = store.getState().data.images.entities;
      bus.emit({
        type: "images/didUpdate",
        updates: assignments.map(({ id }) => imageUpdate(images[id])),
      });
    } else {
      store.dispatch(
        dataSlice.actions.batchUpdateAnnotationPartition(assignments),
      );
      bus.emit({
        type: "annotations/didUpdate",
        volumes: [],
        annotations: assignments,
      });
    }
  }

  /* Writes categories (by hand or as predictions) and announces them. */
  #categorize(
    targetId: string,
    updates: Array<{
      id: string;
      categoryId: string;
      predicted?: { predictedAtRunId: string; predictionConfidence: number };
    }>,
  ): void {
    if (updates.length === 0) return;
    const { store, bus } = this.#deps;
    if (targetId === IMAGE_CLASSIFIER_ID) {
      store.dispatch(dataSlice.actions.batchUpdateImageCategory(updates));
      const images = store.getState().data.images.entities;
      bus.emit({
        type: "images/didUpdate",
        updates: updates.map(({ id }) => imageUpdate(images[id])),
      });
    } else {
      store.dispatch(
        dataSlice.actions.batchBubbleUpdateAnnotationCategory(updates),
      );
      const { annotations, annotationVolumes } = store.getState().data;
      const volumeIds = new Set(
        updates.map(({ id }) => annotations.entities[id]?.volumeId),
      );
      const partitions: AnnotationUpdate[] = annotations.ids
        .filter((id) => volumeIds.has(annotations.entities[id].volumeId))
        .map((id) => ({ id, partition: annotations.entities[id].partition }));
      bus.emit({
        type: "annotations/didUpdate",
        volumes: [...volumeIds]
          .filter(
            (id): id is string => !!id && !!annotationVolumes.entities[id],
          )
          .map((id) => volumeUpdate(annotationVolumes.entities[id])),
        annotations: partitions,
      });
    }
  }

  // ── Domain ─────────────────────────────────────────────────────────────────

  async listArchitectures(): Promise<ModelDescriptor[]> {
    return ARCHITECTURES;
  }

  async list(): Promise<Classifier[]> {
    return this.#records();
  }

  async create(request: ClassifierCreateRequest): Promise<Classifier> {
    const arch = modelArchOf(request.architectureId);
    if (arch === undefined) {
      throw new BackendError(
        "MODEL_NOT_FOUND",
        `No architecture ${request.architectureId}`,
      );
    }
    if (this.#records().some((c) => c.name === request.name)) {
      throw new BackendError(
        "MODEL_CREATE_FAILED",
        `A classifier named "${request.name}" already exists`,
      );
    }
    const seed = request.seed ?? Math.floor(Math.random() * 1000);
    const dto = unwrap(
      await this.#deps.classifier().createNewModel(request.name, arch, seed),
    );
    const record = defaultClassifier(
      {
        // The worker keys the model by the name it settled on.
        id: dto.name,
        name: dto.name,
        targetId: request.targetId,
        architectureId: request.architectureId,
      },
      {
        preprocessSettings: structuredClone(request.hyperparameters.preprocess),
        optimizerSettings: structuredClone(request.hyperparameters.optimizer),
      },
    );
    record.initSeed = seed;
    return this.#write(record);
  }

  async update(request: ClassifierUpdateRequest): Promise<Classifier> {
    const record = this.#record(request.classifierId);
    return this.#write({
      ...record,
      ...(request.hyperparameters && {
        hyperparameters: structuredClone(request.hyperparameters),
      }),
      ...(request.classMap && { classMap: request.classMap }),
      ...(request.confidenceThreshold !== undefined && {
        confidenceThreshold: Math.min(
          1,
          Math.max(0, request.confidenceThreshold),
        ),
      }),
    });
  }

  async delete(classifierId: string): Promise<void> {
    this.#record(classifierId);
    // The record goes even when the worker never held the model.
    await this.#deps.classifier().removeModel(classifierId);
    this.#deps.store.dispatch(
      classifierSlice.actions.removeClassifier(classifierId),
    );
    this.#announce();
  }

  async fit(
    request: ClassifierFitRequest,
    options?: CallOptions,
  ): Promise<ClassifierFitSummary> {
    const { jobs } = this.#deps;
    const record = this.#record(request.classifierId);
    // Never started, so there is no job or run to report.
    if (options?.signal?.aborted) return { status: "stopped" };
    const job = jobs.start(
      "classifier-fit",
      `Training ${record.name}`,
      options?.signal,
    );
    try {
      const summary = await this.#fit(job.id, record, request, options);
      jobs.finish(
        job.id,
        summary.status === "stopped" ? "cancelled" : "succeeded",
        { message: `Training ${summary.status}` },
      );
      return summary;
    } catch (error) {
      jobs.finish(
        job.id,
        isTaskCancelledError(error) ? "cancelled" : "failed",
        { error: (error as Error).message },
      );
      throw error;
    }
  }

  async #fit(
    jobId: string,
    record: Classifier,
    request: ClassifierFitRequest,
    options?: CallOptions,
  ): Promise<ClassifierFitSummary> {
    const { jobs, bus } = this.#deps;
    const cfApi = this.#deps.classifier();
    const signal = jobs.signal(jobId);
    if (signal.aborted) throw new TaskCancelledError();
    if (!record.valid) {
      throw new BackendError(
        "TRAINING_FAILED",
        "The categories changed since the last run; create a new classifier",
      );
    }
    const { preprocess, optimizer } = record.hyperparameters;
    const seed =
      request.seed ?? record.initSeed ?? Math.floor(Math.random() * 1000);
    const dto = unwrap(await cfApi.getModelInfo(record.id));
    // A model the worker has not built yet starts fresh: its output layer
    // is sized to the categories now, and the class map follows them.
    const fresh = !dto.modelLoaded;
    const categories = this.#knownCategories(record.targetId);
    let classMap: ModelClassMap | undefined = record.classMap;
    if (fresh) {
      classMap = Object.fromEntries(
        categories.map((category, index) => [String(index), category.id]),
      );
    } else if (!classMap) {
      throw new BackendError(
        "TRAINING_FAILED",
        "Map the model's classes to the project's categories before training",
      );
    }
    const classes = Object.values(classMap).map((id) => ({ id }));

    const items = this.#items(record.targetId);
    const split = splitForTraining(items, {
      trainingPercentage: preprocess.trainingPercentage,
      shuffle: preprocess.shuffle,
      seed,
      continued: !fresh,
    });
    if (split.training.length === 0 || split.validation.length === 0) {
      throw new BackendError(
        "PREPROCESS_FAILED",
        `Cannot train: need at least one training and one validation item ` +
          `(got ${split.training.length} training, ${split.validation.length} validation). ` +
          `Label more items or adjust the training percentage.`,
      );
    }
    const byId = new Map(items.map((item) => [item.id, item]));
    const trainingData = split.training.map((it) =>
      toTrainingInput(byId.get(it.id)!),
    );
    const validationData = split.validation.map((it) =>
      toTrainingInput(byId.get(it.id)!),
    );
    this.#assignPartitions(record.targetId, split.assignments);

    const [trainingFingerprint, validationFingerprint, categorySetHash] =
      await Promise.all([
        fingerprintItems(trainingData),
        fingerprintItems(validationData),
        hashCategorySet(categories.map((c) => c.id)),
      ]);
    const parentRun = record.runs.findLast((r) => r.status !== "in-progress");

    if (fresh) {
      ensure(
        await cfApi.prepareModel(
          record.id,
          trainingData,
          validationData,
          categories.length,
          categories,
          preprocess,
          optimizer,
          seed,
        ),
      );
    } else {
      if (optimizerChanged(parentRun?.hyperparameters.optimizer, optimizer)) {
        unwrap(await cfApi.recompile(record.id, optimizer));
      }
      const trainingChanged =
        trainingFingerprint !== parentRun?.trainingFingerprint;
      const validationChanged =
        validationFingerprint !== parentRun?.validationFingerprint;
      if (!dto.trainingLoaded || (trainingChanged && validationChanged)) {
        unwrap(
          await cfApi.loadData(
            record.id,
            trainingData,
            validationData,
            classes,
            seed,
          ),
        );
      } else if (trainingChanged) {
        unwrap(
          await cfApi.loadTraining(record.id, trainingData, classes, seed),
        );
      } else if (validationChanged) {
        unwrap(
          await cfApi.loadValidation(record.id, validationData, classes, seed),
        );
      }
    }

    const trainingIds = new Set(trainingData.map((d) => d.id));
    const corrected = items.some(
      (item) =>
        trainingIds.has(item.id) &&
        item.predictionCorrected?.correctedFromRunId === parentRun?.id,
    );
    const trigger: RunTrigger = fresh
      ? "fresh"
      : corrected
        ? "hitl-correction"
        : "continue";
    const device = unwrap(await cfApi.getModelBackend());
    const run: Run = {
      id: generateUUID(),
      parentRunId: parentRun?.id,
      startedAt: new Date().toISOString(),
      status: "in-progress",
      trigger,
      seed,
      appVersion: import.meta.env.VITE_APP_VERSION ?? "dev",
      frameworkVersion: version_core,
      device,
      hyperparameters: {
        architecture: record.architectureId,
        optimizer: structuredClone(optimizer),
        preprocess: structuredClone(preprocess),
      },
      classMap,
      trainingFingerprint,
      validationFingerprint,
      valIds: validationData.map((d) => d.id),
      categorySetHash,
      history: [],
    };
    let current: Classifier = this.#write({
      ...record,
      classMap,
      classes: categories.map((c) => c.name),
      initSeed: record.initSeed ?? seed,
      busy: "training",
      runs: [...record.runs, run],
    });

    const totalEpochs = optimizer.epochs;
    const onEpochEnd = async (epoch: number, logs?: Logs) => {
      if (
        !logs ||
        logs.categoricalAccuracy === undefined ||
        logs.val_categoricalAccuracy === undefined ||
        logs.loss === undefined ||
        logs.val_loss === undefined
      )
        return;
      const entry = {
        epoch,
        loss: logs.loss as number,
        valLoss: logs.val_loss as number,
        accuracy: logs.categoricalAccuracy as number,
        valAccuracy: logs.val_categoricalAccuracy as number,
      };
      this.#deps.store.dispatch(
        classifierSlice.actions.appendEpoch({
          classifierId: record.id,
          runId: run.id,
          epoch: entry,
        }),
      );
      bus.emit({
        type: "classifiers/didEpoch",
        classifierId: record.id,
        runId: run.id,
        epoch: entry,
      });
      const percent = Math.round(((epoch + 1) / totalEpochs) * 100);
      const message = `Epoch ${epoch + 1} of ${totalEpochs}`;
      options?.onProgress?.({ percent, message });
      jobs.update(jobId, { progress: percent, message });
    };
    const onAbort = () => void cfApi.cancelTraining(record.id);
    signal.addEventListener("abort", onAbort, { once: true });

    const finalize = (
      status: Run["status"],
      details: Partial<Pick<Run, "evalResults" | "weightsRef">> = {},
      summary?: Classifier["summary"],
    ): Classifier => {
      const latest = this.#record(record.id);
      current = this.#write({
        ...latest,
        ...(summary && { summary }),
        busy: undefined,
        trained: latest.trained || status !== "failed",
        runs: latest.runs.map((r) =>
          r.id === run.id
            ? { ...r, ...details, status, finishedAt: new Date().toISOString() }
            : r,
        ),
      });
      return current;
    };

    let evalResults: EvaluationResult | undefined;
    let status: Run["status"];
    try {
      const result = unwrap(
        await cfApi.train(
          record.id,
          { epochs: optimizer.epochs, batchSize: optimizer.batchSize },
          { onEpochEnd },
        ),
      );
      status = result.status;
      evalResults = result.evalResults;
      // The layer table exists once the worker has built the graph.
      const built = await cfApi.getModelInfo(record.id);
      const summary = built.success ? built.data.modelSummary : undefined;
      finalize(status, { evalResults, weightsRef: result.weightsRef }, summary);
    } catch (error) {
      finalize("failed");
      throw error;
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
    return { jobId, runId: run.id, status, evalResults };
  }

  async predict(
    request: ClassifierPredictRequest,
    options?: CallOptions,
  ): Promise<ClassifierPredictSummary> {
    const { jobs } = this.#deps;
    const record = this.#record(request.classifierId);
    if (options?.signal?.aborted) {
      return { predicted: 0, cancelled: true };
    }
    const job = jobs.start(
      "classifier-predict",
      `Predicting with ${record.name}`,
      options?.signal,
      // tfjs inference cannot be interrupted part-way.
      { cancellable: false },
    );
    try {
      const predicted = await this.#predict(job.id, record, request, options);
      jobs.finish(job.id, "succeeded", {
        message: `Predicted ${predicted} items`,
      });
      return { jobId: job.id, predicted, cancelled: false };
    } catch (error) {
      jobs.finish(job.id, "failed", { error: (error as Error).message });
      throw error;
    }
  }

  async #predict(
    jobId: string,
    record: Classifier,
    request: ClassifierPredictRequest,
    options?: CallOptions,
  ): Promise<number> {
    const cfApi = this.#deps.classifier();
    const { classMap } = record;
    if (!classMap) {
      throw new BackendError(
        "PREDICTION_FAILED",
        "Map the model's classes to the project's categories before predicting",
      );
    }
    const run = record.runs.at(-1);
    if (!run) {
      throw new BackendError("PREDICTION_FAILED", "The classifier has no run");
    }
    const wanted = request.ids && new Set(request.ids);
    const items = this.#items(record.targetId).filter(
      (item) =>
        representsUnknown(item.categoryId) && (!wanted || wanted.has(item.id)),
    );
    if (items.length === 0) return 0;

    const progress = (percent: number, message: string) => {
      options?.onProgress?.({ percent, message });
      this.#deps.jobs.update(jobId, { progress: percent, message });
    };
    this.#write({ ...record, busy: "predicting" });
    try {
      progress(-1, `Preparing ${items.length} items`);
      unwrap(
        await cfApi.loadInference(
          record.id,
          items.map((item) => toInferenceInput(item)),
          [],
        ),
      );
      progress(-1, "Predicting");
      const results = unwrap(
        await cfApi.predict(
          record.id,
          Object.values(classMap).map((id) => ({ id })),
        ),
      );
      this.#categorize(
        record.targetId,
        items.map((item, i) => ({
          id: item.id,
          categoryId: results[i].categoryId,
          predicted: {
            predictionConfidence: results[i].maxProb,
            predictedAtRunId: run.id,
          },
        })),
      );
      // The full distributions back the softmax sort; a session artifact.
      this.#deps.store.dispatch(
        classifierSlice.actions.setActiveSoftmax({
          targetId: record.targetId,
          softmax: Object.fromEntries(
            items.map((item, i) => [item.id, results[i].softmax]),
          ),
        }),
      );
      return items.length;
    } finally {
      this.#write({ ...this.#record(record.id), busy: undefined });
    }
  }

  async evaluate(classifierId: string): Promise<EvaluationResult> {
    const record = this.#record(classifierId);
    const run = record.runs.at(-1);
    if (!run) {
      throw new BackendError("EVALUATION_FAILED", "The classifier has no run");
    }
    this.#write({ ...record, busy: "evaluating" });
    try {
      const evalResults = unwrap(
        await this.#deps.classifier().evaluate(record.id),
      );
      const latest = this.#record(record.id);
      this.#write({
        ...latest,
        busy: undefined,
        runs: latest.runs.map((r) =>
          r.id === run.id ? { ...r, evalResults } : r,
        ),
      });
      return evalResults;
    } catch (error) {
      this.#write({ ...this.#record(record.id), busy: undefined });
      throw error;
    }
  }

  /* Items whose category was predicted and not yet accepted or cleared. */
  #pending(targetId: string): Item[] {
    return this.#items(targetId).filter(
      (item) =>
        item.partition === Partition.Inference &&
        !representsUnknown(item.categoryId),
    );
  }

  #clearSoftmax(targetId: string): void {
    this.#deps.store.dispatch(
      classifierSlice.actions.setActiveSoftmax({
        targetId,
        softmax: undefined,
      }),
    );
  }

  async acceptPredictions(targetId: string): Promise<Changed> {
    const pending = this.#pending(targetId);
    this.#assignPartitions(
      targetId,
      pending.map((item) => ({ id: item.id, partition: Partition.Unassigned })),
    );
    this.#clearSoftmax(targetId);
    return { changed: pending.length };
  }

  async clearPredictions(targetId: string): Promise<Changed> {
    const pending = this.#pending(targetId);
    const unknown = this.#unknownCategoryId(targetId);
    this.#categorize(
      targetId,
      pending.map((item) => ({ id: item.id, categoryId: unknown })),
    );
    this.#clearSoftmax(targetId);
    return { changed: pending.length };
  }

  async export(classifierId: string): Promise<ClassifierExport> {
    const record = this.#record(classifierId);
    const { modelJson, modelWeights } = unwrap(
      await this.#deps.classifier().getSavedModelData(record.id),
    );
    const blob = await buildClassifierZip(
      { modelJson: modelJson.blob, modelWeights: modelWeights.blob },
      record.runs,
      { modelName: record.name },
    );
    return {
      fileName: `${record.name}.zip`,
      mime: "application/zip",
      data: new Uint8Array(await blob.arrayBuffer()),
    };
  }

  async import(request: ClassifierImportRequest): Promise<Classifier> {
    const { modelDetails, runs } = await importFittedModelFromZip(
      request.data.buffer.slice(
        request.data.byteOffset,
        request.data.byteOffset + request.data.byteLength,
      ) as ArrayBuffer,
    );
    const record = classifierFromDTO(modelDetails, request.targetId, runs);
    if (request.name) record.name = request.name;
    // The archive's class map still applies when its categories exist here.
    const categoryIds = new Set(
      this.#knownCategories(request.targetId).map((c) => c.id),
    );
    const lastMap = runs.at(-1)?.classMap;
    if (
      lastMap &&
      Object.keys(lastMap).length === modelDetails.classes.length &&
      Object.values(lastMap).every((id) => categoryIds.has(id))
    ) {
      record.classMap = lastMap;
    }
    return this.#write(record);
  }
}
