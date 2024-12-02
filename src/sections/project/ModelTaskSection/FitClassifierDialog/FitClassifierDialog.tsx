import { Dialog, DialogContent, List } from "@mui/material";

import { useFitClassificationModel } from "hooks";

import {
  ModelSummaryTable,
  TwoDataPlot,
} from "sections/project/ModelTaskSection/data-display";
import { DialogTransitionSlide } from "components/dialogs";
import { AlertBar } from "components/ui/AlertBar";

import { FitClassifierDialogAppBar } from "./FitClassifierDialogAppBar";
import { ClassifierPreprocessingListItem } from "./ClassifierPreprocessingListItem";
import { ClassifierArchitectureListItem } from "./ClassifierArchitectureListItem";
import { ClassifierOptimizerListItem } from "./ClassifierOptimizerListItem";
import { ClassifierDatasetListItem } from "./ClassifierDatasetListItem";

import { ModelStatus } from "utils/models/enums";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = ({
  closeDialog,
  openedDialog,
}: FitClassifierDialogProps) => {
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
  } = useFitClassificationModel();

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={closeDialog}
        open={openedDialog}
        TransitionComponent={DialogTransitionSlide}
        style={{ zIndex: 1203, height: "100%" }}
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

        <DialogContent>
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
          {showPlots && (
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
          )}
          {/* TODO: implement model summary for graph models */}
          {modelStatus > ModelStatus.Training && !selectedModel.graph && (
            <div>
              <ModelSummaryTable model={selectedModel} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
