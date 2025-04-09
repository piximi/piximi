import { shuffle, take, takeRight } from "lodash";
import { isUnknownCategory } from "store/data/helpers";
import { Category, Shape, Thing } from "store/data/types";
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

export const prepareClasses = (
  allCategories: Record<string, Category>,
  activeCategoryIds: string[]
) => {
  return activeCategoryIds.reduce(
    (categoryInfo: { categories: Array<Category>; numClasses: number }, id) => {
      const category = allCategories[id];
      if (isUnknownCategory(id) || !category) return categoryInfo;
      categoryInfo.categories.push(category);
      categoryInfo.numClasses++;
      return categoryInfo;
    },
    { categories: [], numClasses: 0 }
  );
};
export const prepareTrainingData = (
  allThings: Record<string, Thing>,
  activeThingIds: string[],
  shuffleData: boolean,
  trainingPercentage: number,
  init: boolean
) => {
  const {
    unlabeledThings,
    labeledTraining,
    labeledValidation,
    labeledUnassigned,
  } = activeThingIds.reduce(
    (
      groupedThings: {
        unlabeledThings: Thing[];
        labeledTraining: Thing[];
        labeledValidation: Thing[];
        labeledUnassigned: Thing[];
      },
      id
    ) => {
      const thing = allThings[id];
      if (!thing) return groupedThings;
      if (isUnknownCategory(thing.categoryId)) {
        groupedThings.unlabeledThings.push(thing);
      } else if (thing.partition === Partition.Unassigned) {
        groupedThings.labeledUnassigned.push(thing);
      } else if (thing.partition === Partition.Training) {
        groupedThings.labeledTraining.push(thing);
      } else if (thing.partition === Partition.Validation) {
        groupedThings.labeledValidation.push(thing);
      }
      return groupedThings;
    },
    {
      unlabeledThings: [],
      labeledTraining: [],
      labeledValidation: [],
      labeledUnassigned: [],
    }
  );
  let splitLabeledTraining: Thing[] = [];
  let splitLabeledValidation: Thing[] = [];
  if (init) {
    const trainingThingsLength = Math.round(
      trainingPercentage * labeledUnassigned.length
    );
    const validationThingsLength =
      labeledUnassigned.length - trainingThingsLength;

    const preparedLabeledUnassigned = shuffleData
      ? shuffle(labeledUnassigned)
      : labeledUnassigned;

    splitLabeledTraining = take(
      preparedLabeledUnassigned,
      trainingThingsLength
    );
    splitLabeledValidation = takeRight(
      preparedLabeledUnassigned,
      validationThingsLength
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
};
export const prepareModel = async (
  model: SequentialClassifier,
  trainingData: Thing[],
  validationData: Thing[],
  numClasses: number,
  categories: Category[],
  preprocessSettings: PreprocessSettings,
  inputShape: Shape,
  compileOptions: OptimizerSettings,
  fitOptions: FitOptions
) => {
  /* LOAD CLASSIFIER MODEL */

  try {
    if (model instanceof SimpleCNN) {
      (model as SimpleCNN).loadModel({
        inputShape,
        numClasses,
        randomizeWeights: preprocessSettings.shuffle,
        compileOptions,
      });
    } else if (model instanceof MobileNet) {
      await (model as MobileNet).loadModel({
        inputShape,
        numClasses,
        compileOptions,
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
    throw new Error("Failed to create tensorflow model", error as Error);
    // handleError(
    //   listenerAPI,
    //   error as Error,
    //   "Failed to create tensorflow model",
    //   activeKindId,
    //   { fittingError: true },
    // );
    return;
  }
  try {
    const loadDataArgs = {
      categories,
      inputShape,
      preprocessOptions: preprocessSettings,
      fitOptions,
    };
    model.loadTraining(trainingData, loadDataArgs);
    model.loadValidation(validationData, loadDataArgs);
  } catch (error) {
    throw new Error("Error in preprocessing", error as Error);
    // handleError(
    //   listenerAPI,
    //   error as Error,
    //   "Error in preprocessing",
    //   activeKindId,
    //   {
    //     fittingError: true,
    //   },
    // );
    return;
  }
};

export const trainModel = async (
  model: SequentialClassifier,
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  fitOptions: FitOptions
) => {
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
  // try {
  //   if (!onEpochEnd) {
  //     if (import.meta.env.NODE_ENV !== "production") {
  //       console.warn("Epoch end callback not provided");
  //     }
  //     onEpochEnd = async (epoch: number, logs: any) => {
  //       logger(`Epcoch: ${epoch}`);
  //       logger(logs);
  //     };
  //   }

  //   const history = await model.train(fitOptions, { onEpochEnd });
  //   import.meta.env.NODE_ENV !== "production" &&
  //     import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
  //     logger(history);
  // } catch (error) {
  //   console.log(error);
  //   throw new Error("Error training the model", error as Error);
  //   // handleError(
  //   //   listenerAPI,
  //   //   error as Error,
  //   //   "Error training the model",
  //   //   activeKindId,
  //   // );
  //   return;
  // }
};
