import { shuffle, take, takeRight } from "lodash";
import { isUnknownCategory } from "store/data/helpers";
import { Category, Thing } from "store/data/types";
import { logger } from "utils/common/helpers";
import {
  MobileNet,
  SequentialClassifier,
  SimpleCNN,
} from "utils/models/classification";
import { Partition } from "utils/models/enums";
import {
  FitOptions,
  OptimizerSettings,
  PreprocessSettings,
  TrainingCallbacks,
} from "utils/models/types";

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
  allThings: Record<string, Thing>,
  activeThingIds: string[],
): {
  unlabeledThings: Thing[];
  labeledTraining: Thing[];
  labeledUnassigned: Thing[];
  labeledValidation: Thing[];
  splitLabeledTraining: Thing[];
  splitLabeledValidation: Thing[];
};
export function prepareTrainingData(
  shuffleData: boolean,
  trainingPercentage: number,
  init: boolean,
  allThings: Thing[],
): {
  unlabeledThings: Thing[];
  labeledTraining: Thing[];
  labeledUnassigned: Thing[];
  labeledValidation: Thing[];
  splitLabeledTraining: Thing[];
  splitLabeledValidation: Thing[];
};
export function prepareTrainingData(
  shuffleData: boolean,
  trainingPercentage: number,
  init: boolean,
  allThings: Record<string, Thing> | Thing[],
  activeThingIds?: string[],
) {
  const unlabeledThings: Thing[] = [];
  const labeledTraining: Thing[] = [];
  const labeledValidation: Thing[] = [];
  const labeledUnassigned: Thing[] = [];
  if (activeThingIds) {
    activeThingIds.forEach((id) => {
      const thing = (allThings as Record<string, Thing>)[id];
      if (!thing) throw new Error("Active Thing Ids not in sync with things");
      if (isUnknownCategory(thing.categoryId)) {
        unlabeledThings.push(thing);
      } else if (thing.partition === Partition.Unassigned) {
        labeledUnassigned.push(thing);
      } else if (thing.partition === Partition.Training) {
        labeledTraining.push(thing);
      } else if (thing.partition === Partition.Validation) {
        labeledValidation.push(thing);
      }
    });
  } else {
    (allThings as Thing[]).forEach((thing) => {
      if (isUnknownCategory(thing.categoryId)) {
        unlabeledThings.push(thing);
      } else if (thing.partition === Partition.Unassigned) {
        labeledUnassigned.push(thing);
      } else if (thing.partition === Partition.Training) {
        labeledTraining.push(thing);
      } else if (thing.partition === Partition.Validation) {
        labeledValidation.push(thing);
      }
    });
  }
  let splitLabeledTraining: Thing[] = [];
  let splitLabeledValidation: Thing[] = [];
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
  trainingData: Thing[],
  validationData: Thing[],
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
    console.log(error);
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
    console.log(error);
    throw new Error("Error training the model", { cause: error as Error });

    return;
  }
};
