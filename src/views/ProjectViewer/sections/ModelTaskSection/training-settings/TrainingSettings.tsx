import React, { useMemo } from "react";

import { useSelector } from "react-redux";

import { saveAs } from "file-saver";

import { Button } from "@mui/material";

import {
  selectActiveClassifierModelTarget,
  selectProjectName,
} from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";
import type { ModelInfo } from "store/classifier/types";
import { BASE_MODEL_NAME } from "store/classifier/constants";

import { HyperperameterSettings } from "./HyperparameterSettings";
import { ModelPicker } from "./ModelPicker";

export const TrainingSettings = () => {
  return (
    <div>
      <ModelPicker />
      <HyperperameterSettings />
      <ExportHyperparametersButton />
    </div>
  );
};

function ExportHyperparametersButton() {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget.id,
  );

  const hyperparameters = useMemo(() => {
    const modelName = kindClassifier.activeModel;
    let modelInfo: ModelInfo;
    if (!modelName) modelInfo = kindClassifier.modelInfoDict[BASE_MODEL_NAME];
    else modelInfo = kindClassifier.modelInfoDict[modelName];
    return {
      preprocessSettings: modelInfo.preprocessSettings,
      optimizerSettings: modelInfo.optimizerSettings,
    };
  }, [kindClassifier]);
  const projectName = useSelector(selectProjectName);
  const handleExportHyperparameters = () => {
    const data = new Blob([JSON.stringify(hyperparameters)], {
      type: "application/json;charset=utf-8",
    });

    saveAs(data, `${projectName}-model_hyperparameters.json`);
  };
  return (
    <Button onClick={handleExportHyperparameters}>
      Export Hyperparameters
    </Button>
  );
}
