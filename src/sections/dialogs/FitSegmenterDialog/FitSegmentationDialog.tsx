import { Dialog, DialogContent, List } from "@mui/material";

import { useSegmentationModelAgain } from "hooks";

import { TwoDataPlot } from "components/TwoDataPlot";
import { ModelSummaryTable } from "components/ModelSummaryTable";
import { DialogTransitionSlide } from "components/DialogTransitionSlide";
import { AlertBar } from "components/AlertBar";

import { FitSegmenterDialogAppBar } from "./FitSegmenterDialogAppBar";
import { SegmenterArchitectureListItem } from "./SegmenterArchitectureListItem";
import { SegmenterOptimizerListItem } from "./SegmenterOptimizerListItem";
import { SegmenterDatasetListItem } from "./SegmenterDatasetListItem";

import { ModelStatus } from "utils/models/enums";

type FitSegmenterDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitSegmenterDialog = ({
  closeDialog,
  openedDialog,
}: FitSegmenterDialogProps) => {
  const {
    modelStatus,
    selectedModel,
    fitOptions,
    hasLabeledImages,
    handleFit,
    currentEpoch,
    trainingAccuracy,
    trainingLoss,
    trainingPercentage,
    validationAccuracy,
    validationLoss,
    showPlots,
    showWarning,
    setShowWarning,
    noLabeledImageAlert,
    alertState,
  } = useSegmentationModelAgain();

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
        <FitSegmenterDialogAppBar
          closeDialog={closeDialog}
          fit={handleFit}
          noLabels={!hasLabeledImages}
          noTrain={!selectedModel.trainable}
          epochs={fitOptions.epochs}
          currentEpoch={currentEpoch}
        />

        {showWarning && !hasLabeledImages && selectedModel.trainable && (
          <AlertBar
            setShowAlertBar={setShowWarning}
            alertState={noLabeledImageAlert}
          />
        )}

        {alertState.visible && <AlertBar alertState={alertState} />}

        <DialogContent>
          <List dense>
            <SegmenterArchitectureListItem />

            <SegmenterOptimizerListItem
              fitOptions={fitOptions}
              trainable={selectedModel.trainable}
            />

            <SegmenterDatasetListItem
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

          {modelStatus > ModelStatus.Training && !selectedModel.graph && (
            <div>
              {/*  TODO: implement model summary for graph models */}
              <ModelSummaryTable model={selectedModel} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
