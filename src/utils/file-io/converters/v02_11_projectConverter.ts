import React from "react";
import {
  V02ClassifierState,
  V02Kind,
  V02Project,
  V11ClassifierState,
  V11KindClassifierDict,
  V11OptimizerSettings,
  V11PreprocessSettings,
  V11Project,
} from "../types";
import { v11GetDefaultModelInfo } from "../utils";

const v02_11_classifierConverter = (
  classifier: V02ClassifierState,
  kindIds: Array<V02Kind["id"]>,
): V11ClassifierState => {
  const kindClassifiers: V11KindClassifierDict = {};
  const preprocessSettings: V11PreprocessSettings = {
    ...classifier.preprocessOptions,
    inputShape: classifier.inputShape,
    trainingPercentage: classifier.trainingPercentage,
  };
  const optimizerSettings: V11OptimizerSettings = {
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
          ...v11GetDefaultModelInfo(),
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
