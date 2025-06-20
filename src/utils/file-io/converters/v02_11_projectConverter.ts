import React from "react";
import { V01_ClassifierState, V02Project, V11Project } from "../types";
import { Kind } from "store/data/types";
import { ClassifierState, KindClassifierDict } from "store/types";
import { OptimizerSettings, PreprocessSettings } from "utils/models/types";
import { getDefaultModelInfo } from "utils/models/classification/utils";

const v02_11_classifierConverter = (
  classifier: V01_ClassifierState,
  kindIds: Array<Kind["id"]>,
): ClassifierState => {
  const kindClassifiers: KindClassifierDict = {};
  const preprocessSettings: PreprocessSettings = {
    ...classifier.preprocessOptions,
    inputShape: classifier.inputShape,
    trainingPercentage: classifier.trainingPercentage,
  };
  const optimizerSettings: OptimizerSettings = {
    learningRate: classifier.learningRate,
    lossFunction: classifier.lossFunction,
    metrics: classifier.metrics,
    optimizationAlgorithm: classifier.optimizationAlgorithm,
    epochs: classifier.fitOptions.epochs,
    batchSize: classifier.fitOptions.batchSize,
  };

  kindIds.forEach((kindId) => {
    kindClassifiers[kindId] = {
      modelNameOrArch: 0,
      modelInfoDict: {
        "base-model": {
          ...getDefaultModelInfo(),
          preprocessSettings,
          optimizerSettings,
        },
      },
    };
  });
  return {
    showClearPredictionsWarning: true,
    kindClassifiers,
  };
};

export const v02_11_projectConverter = (v02Project: V02Project): V11Project => {
  const { classifier: oldClassifier, data } = v02Project;
  const classifier = v02_11_classifierConverter(oldClassifier, data.kinds.ids);
  return {
    project: v02Project.project,
    data: v02Project.data,
    segmenter: v02Project.segmenter,
    classifier,
  };
};
