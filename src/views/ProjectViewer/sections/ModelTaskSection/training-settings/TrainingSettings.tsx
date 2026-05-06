import React, { useMemo } from "react";

import { useSelector } from "react-redux";

import { saveAs } from "file-saver";

import { Button } from "@mui/material";

import {
  selectActiveClassifierModelTarget,
  selectProjectName,
} from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectModelInfo } from "store/classifier/selectors";

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
  const modelInfo = useParameterizedSelector(selectModelInfo, modelTarget);

  const hyperparameters = useMemo(() => {
    return {
      preprocessSettings: modelInfo.preprocessSettings,
      optimizerSettings: modelInfo.optimizerSettings,
    };
  }, [modelInfo]);
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
