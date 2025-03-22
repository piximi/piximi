import { Button } from "@mui/material";
import saveAs from "file-saver";
import { useSelector } from "react-redux";

import { selectActiveClassifierHyperparameters } from "store/classifier/reselectors";
import { selectProjectName } from "store/project/selectors";

export const ExportHyperparametersButton = () => {
  const hyperparameters = useSelector(selectActiveClassifierHyperparameters);
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
};

export default ExportHyperparametersButton;
