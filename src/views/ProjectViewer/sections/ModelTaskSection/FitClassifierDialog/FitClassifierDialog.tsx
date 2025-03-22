import { Box, Dialog, DialogContent, Tabs } from "@mui/material";

import { useFitClassificationModel } from "hooks";

import {
  ModelSummaryTable,
  TwoDataPlot,
} from "views/ProjectViewer/sections/ModelTaskSection/data-display";
import { DialogTransitionSlide } from "components/dialogs";
import { AlertBar } from "components/ui/AlertBar";

import { FitClassifierDialogAppBar } from "./FitClassifierDialogAppBar";

import { ModelStatus } from "utils/models/enums";
import { ToolTipTab } from "components/layout";
import { useEffect, useState } from "react";
import TrainingSettings from "../training-settings/TrainingSettings";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = ({
  closeDialog,
  openedDialog,
}: FitClassifierDialogProps) => {
  const [tabVal, setTabVal] = useState("1");

  const [ModelNameOrArch, setModelNameOrArch] = useState<string | number>(0);
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
    noLabeledThingsAlert,
    handleFit,
    hasLabeledInference,
  } = useFitClassificationModel();

  const onTabSelect = (_event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  //const handleTrainingTypeSelect = () => {};

  useEffect(() => {
    if (showPlots) {
      setTabVal("2");
    }
  }, [showPlots]);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={closeDialog}
      open={openedDialog}
      slots={{ transition: DialogTransitionSlide }}
      sx={{
        zIndex: 1203,
        //height: "80%",
        pb: 1,
      }}
    >
      <FitClassifierDialogAppBar
        closeDialog={closeDialog}
        fit={handleFit}
        noLabels={noLabeledThings}
        hasLabeledInference={hasLabeledInference}
        trainable={!selectedModel || selectedModel.trainable}
        currentEpoch={currentEpoch}
        modelNameOrArch={ModelNameOrArch}
      />

      {showWarning &&
        noLabeledThings &&
        (!selectedModel || selectedModel?.trainable) && (
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
            modelStatus <= ModelStatus.Training || !!selectedModel?.graph
          }
        />
      </Tabs>

      <DialogContent>
        <Box hidden={tabVal !== "1"}>
          <TrainingSettings
            newModelArchitecture={ModelNameOrArch}
            setNewModelArchitecture={setModelNameOrArch}
            trainable={!selectedModel || !!selectedModel?.trainable}
          />
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
          {modelStatus > ModelStatus.Training &&
            !selectedModel?.graph &&
            selectedModel && <ModelSummaryTable model={selectedModel} />}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
