import { Dialog, DialogContent, List } from "@mui/material";

import {
  SegmenterOptimizerListItem,
  SegmenterDatasetListItem,
  SegmenterArchitectureListItem,
} from "components/list-items";
import { TwoDataPlot, ModelSummaryTable } from "components/data-viz";
import { DialogTransitionSlide } from "components/dialogs";
import { FitSegmenterDialogAppBar, AlertBar } from "components/app-bars";
import { ModelStatus } from "types/ModelType";
import { useSegmentationModelAgain } from "hooks/useLearningModel/useSegmentationModelAgain";

type FitSegmenterDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitSegmenterDialogNew = ({
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
