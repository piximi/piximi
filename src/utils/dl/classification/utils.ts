import { shuffle, take, takeRight } from "lodash";

import { isUnknownCategory } from "store/data/utils";
import { logger } from "utils/logUtils";

import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
  Partition,
} from "utils/dl/enums";
import {
  FitOptions,
  OptimizerSettings,
  PreprocessSettings,
  TrainingCallbacks,
  TrainingInput,
} from "utils/dl/types";
import { SequentialClassifier } from "./AbstractClassifier";
import { SimpleCNN } from "./SimpleCNN";
import { MobileNet } from "./MobileNet";
import { representsUnknown } from "utils/stringUtils";
import type { Category } from "store/dataV2/types";
import { ModelInfo } from "store/classifier/types";

export const getDefaultModelParams = (): Pick<
  ModelInfo,
  "optimizerSettings" | "preprocessSettings"
> => ({
  optimizerSettings: {
    epochs: 10,
    batchSize: 32,
    learningRate: 0.01,
    lossFunction: LossFunction.CategoricalCrossEntropy,
    metrics: [Metric.CategoricalAccuracy],
    optimizationAlgorithm: OptimizationAlgorithm.Adam,
  },
  preprocessSettings: {
    inputShape: {
      planes: 1,
      height: 20,
      width: 20,
      channels: 1,
    },
    shuffle: true,
    normalizeOptions: {
      normalize: true,
      center: false,
    },
    cropOptions: {
      numCrops: 1,
      cropSchema: CropSchema.None,
    },
    trainingPercentage: 0.75,
  },
});

export const getDefaultModelInfo = (): ModelInfo => ({
  ...getDefaultModelParams(),
  status: "idle",
  confidenceThreshold: 0.5,
  runs: [],
});

export function prepareClasses(allCategories: Category[]): {
  categories: Category[];
  numClasses: number;
};
export function prepareClasses(
  allCategories: Record<string, Category>,
  activeCategoryIds: string[],
): { categories: Category[]; numClasses: number };
export function prepareClasses(
  allCategories: Record<string, Category> | Category[],
  activeCategoryIds?: string[],
) {
  if (activeCategoryIds) {
    return activeCategoryIds.reduce(
      (
        categoryInfo: { categories: Array<Category>; numClasses: number },
        id,
      ) => {
        const category = (allCategories as Record<string, Category>)[id];
        if (isUnknownCategory(id) || !category) return categoryInfo;
        categoryInfo.categories.push(category);
        categoryInfo.numClasses++;
        return categoryInfo;
      },
      { categories: [], numClasses: 0 },
    );
  } else {
    return (allCategories as Category[]).reduce(
      (
        categoryInfo: { categories: Array<Category>; numClasses: number },
        category,
      ) => {
        if (isUnknownCategory(category.id)) return categoryInfo;
        categoryInfo.categories.push(category);
        categoryInfo.numClasses++;
        return categoryInfo;
      },
      { categories: [], numClasses: 0 },
    );
  }
}

export function prepareTrainingData(
  shuffleData: boolean,
  trainingPercentage: number,
  init: boolean,
  items: TrainingInput[],
) {
  const unlabeledThings: TrainingInput[] = [];
  const labeledTraining: TrainingInput[] = [];
  const labeledValidation: TrainingInput[] = [];
  const labeledUnassigned: TrainingInput[] = [];

  items.forEach((thing) => {
    if (representsUnknown(thing.categoryId)) {
      unlabeledThings.push(thing);
    } else if (thing.partition === Partition.Unassigned) {
      labeledUnassigned.push(thing);
    } else if (thing.partition === Partition.Training) {
      labeledTraining.push(thing);
    } else if (thing.partition === Partition.Validation) {
      labeledValidation.push(thing);
    }
  });

  let splitLabeledTraining: TrainingInput[] = [];
  let splitLabeledValidation: TrainingInput[] = [];
  if (init) {
    const trainingThingsLength = Math.round(
      trainingPercentage * labeledUnassigned.length,
    );
    const validationThingsLength =
      labeledUnassigned.length - trainingThingsLength;

    const preparedLabeledUnassigned = shuffleData
      ? shuffle(labeledUnassigned)
      : labeledUnassigned;

    splitLabeledTraining = take(
      preparedLabeledUnassigned,
      trainingThingsLength,
    );
    splitLabeledValidation = takeRight(
      preparedLabeledUnassigned,
      validationThingsLength,
    );
  } else {
    splitLabeledTraining = labeledUnassigned;
  }

  return {
    unlabeledThings,
    labeledTraining,
    labeledUnassigned,
    labeledValidation,
    splitLabeledTraining,
    splitLabeledValidation,
  };
}
export const prepareModel = async (
  model: SequentialClassifier,
  trainingData: TrainingInput[],
  validationData: TrainingInput[],
  numClasses: number,
  categories: Category[],
  preprocessSettings: PreprocessSettings,
  optimizerSettings: OptimizerSettings,
) => {
  /* LOAD CLASSIFIER MODEL */
  try {
    if (model instanceof SimpleCNN) {
      (model as SimpleCNN).loadModel({
        inputShape: preprocessSettings.inputShape,
        numClasses,
        randomizeWeights: preprocessSettings.shuffle,
        compileOptions: optimizerSettings,
        preprocessOptions: preprocessSettings,
      });
    } else if (model instanceof MobileNet) {
      await (model as MobileNet).loadModel({
        inputShape: preprocessSettings.inputShape,
        numClasses,
        compileOptions: optimizerSettings,
        preprocessOptions: preprocessSettings,
        freeze: false,
        useCustomTopLayer: true,
      });
    } else {
      import.meta.env.NODE_ENV !== "production" &&
        import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
        console.warn("Unhandled architecture", model.name);
      return;
    }
  } catch (error) {
    throw new Error("Failed to create tensorflow model", {
      cause: error as Error,
    });
  }
  try {
    model.classes = categories.map((cat) => cat.name);
    model.loadTraining(trainingData, categories);
    model.loadValidation(validationData, categories);
  } catch (error) {
    throw new Error("Error in preprocessing", { cause: error as Error });
  }
};

export const trainModel = async (
  model: SequentialClassifier,
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  fitOptions: FitOptions,
) => {
  try {
    if (!onEpochEnd) {
      if (import.meta.env.NODE_ENV !== "production") {
        console.warn("Epoch end callback not provided");
      }
      onEpochEnd = async (epoch: number, logs: any) => {
        logger(`Epcoch: ${epoch}`);
        logger(logs);
      };
    }
    const history = await model.train(fitOptions, { onEpochEnd });
    import.meta.env.NODE_ENV !== "production" &&
      import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
      logger(history);
  } catch (error) {
    throw new Error("Error training the model", { cause: error as Error });

    return;
  }
};
