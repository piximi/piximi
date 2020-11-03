import { Dataset } from "@tensorflow/tfjs-data";
import { LayersModel, Tensor } from "@tensorflow/tfjs";
import { sortBy } from "underscore";
import {
  Category,
  Classifier,
  CompileOptions,
  FitOptions,
  Image,
  Project,
} from "../../store";
export const categoriesCountSelector = ({
  project,
}: {
  project: Project;
}): number => {
  return project.categories.length - 1;
};
export const categoriesSelector = ({
  project,
}: {
  project: Project;
}): Array<Category> => {
  const categories = project.categories.filter((category: Category) => {
    return category.id !== "00000000-0000-0000-0000-000000000000";
  });
  return sortBy(categories, "name");
};
export const categorizedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<Image> => {
  return project.images.filter((image: Image) => {
    return image.categoryId !== "00000000-0000-0000-0000-00000000000";
  });
};
export const classifierSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Classifier => {
  return classifier;
};
export const compileOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): CompileOptions => {
  return {
    learningRate: classifier.learningRate,
    lossFunction: classifier.lossFunction,
    metrics: classifier.metrics,
    optimizationAlgorithm: classifier.optimizationAlgorithm,
  };
};
export const compiledSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel => {
  return classifier.compiled!;
};
export const dataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Dataset<{ xs: Tensor; ys: Tensor }> => {
  return classifier.data!;
};
export const fitOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): FitOptions => {
  return classifier.fitOptions;
};
export const fittedSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel => {
  return classifier.fitted!;
};
export const generatorOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): { validationPercentage: number } => {
  return { validationPercentage: classifier.validationPercentage };
};
export const imagesSelector = ({
  project,
}: {
  project: Project;
}): Array<Image> => {
  return project.images;
};
export const lossHistorySelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Array<{ x: number; y: number }> => {
  return classifier.lossHistory!;
};
export const openedSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel => {
  return classifier.opened!;
};
export const openingSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.opening;
};
export const projectSelector = ({ project }: { project: Project }): Project => {
  return project;
};
export const trainingPercentageSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.trainingPercentage;
};
export const validationDataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Dataset<{ xs: Tensor; ys: Tensor }> => {
  return classifier.validationData!;
};
export const validationLossHistorySelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Array<{ x: number; y: number }> => {
  return classifier.validationLossHistory!;
};
export const validationPercentageSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.validationPercentage;
};
