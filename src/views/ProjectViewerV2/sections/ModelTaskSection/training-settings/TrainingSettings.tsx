import React from "react";
import { ModelPicker } from "./ModelPicker";
import { HyperperameterSettings } from "./HyperparameterSettings";
import { useSelector } from "react-redux";
import { selectClassifierHyperparameters } from "@ProjectViewer/state/reselectors";
import { selectProjectName } from "@ProjectViewer/state/selectors";
import saveAs from "file-saver";
import { Button } from "@mui/material";

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
  const hyperparameters = useSelector(selectClassifierHyperparameters);
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
