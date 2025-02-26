import { Box, Button, Dialog, DialogContent, List, Tabs } from "@mui/material";

import { useFitClassificationModel } from "hooks";

import {
  ModelSummaryTable,
  TwoDataPlot,
} from "views/ProjectViewer/sections/ModelTaskSection/data-display";
import { DialogTransitionSlide } from "components/dialogs";
import { AlertBar } from "components/ui/AlertBar";

import { FitClassifierDialogAppBar } from "./FitClassifierDialogAppBar";
import { ClassifierPreprocessingListItem } from "./ClassifierPreprocessingListItem";
import { ClassifierArchitectureListItem } from "./ClassifierArchitectureListItem";
import { ClassifierOptimizerListItem } from "./ClassifierOptimizerListItem";
import { ClassifierDatasetListItem } from "./ClassifierDatasetListItem";

import { ModelStatus } from "utils/models/enums";
import { ToolTipTab } from "components/layout";
import { useEffect, useState } from "react";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = ({
  closeDialog,
  openedDialog,
}: FitClassifierDialogProps) => {
  const [tabVal, setTabVal] = useState("1");
  const {
    showWarning,
    setShowWarning,
    currentEpoch,
    showPlots,
    trainingAccuracy,
    validationAccuracy,
    trainingLoss,
    validationLoss,
    noLabeledThings,
    selectedModel,
    modelStatus,
    alertState,
    fitOptions,
    trainingPercentage,
    noLabeledThingsAlert,
    handleFit,
    hasLabeledInference,
    handleExportHyperparameters,
  } = useFitClassificationModel();

  const onTabSelect = (_event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  useEffect(() => {
    if (showPlots) {
      setTabVal("2");
    }
  }, [showPlots]);

  useEffect(() => {
    if (modelStatus > ModelStatus.Training && !selectedModel.graph) {
      setTabVal("3");
    }
  }, [modelStatus, selectedModel.graph]);

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={closeDialog}
        open={openedDialog}
        slots={{ transition: DialogTransitionSlide }}
        style={{
          zIndex: 1203,
          height: "100%",
          transition: "height 2s ease-in-out",
        }}
      >
        <FitClassifierDialogAppBar
          closeDialog={closeDialog}
          fit={handleFit}
          noLabels={noLabeledThings}
          hasLabeledInference={hasLabeledInference}
          noTrain={!selectedModel.trainable}
          epochs={fitOptions.epochs}
          currentEpoch={currentEpoch}
        />

        {showWarning && noLabeledThings && selectedModel.trainable && (
          <AlertBar
            setShowAlertBar={setShowWarning}
            alertState={noLabeledThingsAlert}
          />
        )}

        {alertState.visible && <AlertBar alertState={alertState} />}
        <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
          <ToolTipTab label="HyperParameters" value="1" placement="top" />

          <ToolTipTab
            label="Training Plots"
            value="2"
            disabledMessage="No Trained Model"
            placement="top"
            disabled={!showPlots}
          />

          <ToolTipTab
            label="Model Summary"
            value="3"
            disabledMessage="No Trained Model"
            placement="top"
            disabled={
              modelStatus <= ModelStatus.Training || selectedModel.graph
            }
          />
        </Tabs>
        <DialogContent>
          <Box hidden={tabVal !== "1"}>
            <List dense>
              <ClassifierPreprocessingListItem />

              <ClassifierArchitectureListItem />

              <ClassifierOptimizerListItem
                fitOptions={fitOptions}
                trainable={selectedModel.trainable}
              />
              <ClassifierDatasetListItem
                trainingPercentage={trainingPercentage}
                trainable={selectedModel.trainable}
              />
            </List>
            <Button onClick={handleExportHyperparameters}>
              Export Hyperparameters
            </Button>
          </Box>
          <Box hidden={tabVal !== "2"}>
            <div>
              <TwoDataPlot
                title="Training History - Accuracy per Epoch"
                yLabel="Accuracy"
                xLabel="Epoch"
                yData1={trainingAccuracy}
                id1="Accuracy"
                yData2={validationAccuracy}
                id2="Validation Accuracy"
              />

              <TwoDataPlot
                title="Training History - Loss per Epoch"
                yLabel="Loss"
                xLabel="Epoch"
                yData1={trainingLoss}
                id1="Loss"
                yData2={validationLoss}
                id2="Validation Loss"
                dynamicYRange={true}
              />
            </div>
          </Box>
          <Box hidden={tabVal !== "3"}>
            {/* TODO: implement model summary for graph models */}
            {modelStatus > ModelStatus.Training && !selectedModel.graph && (
              <ModelSummaryTable model={selectedModel} />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
