import { Dialog, DialogContent, List } from "@mui/material";

import { useClassificationModelAgain } from "hooks/useLearningModel/useClassifierModelAgain";
import { AlertBar, FitClassifierDialogAppBar } from "components/app-bars";

import { ModelSummaryTable, TwoDataPlot } from "components/data-viz";
import {
  ClassifierArchitectureListItem,
  ClassifierOptimizerListItem,
  ClassifierPreprocessingListItem,
  ClassifierDatasetListItem,
} from "components/list-items";
import { DialogTransitionSlide } from "components/dialogs";
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
    labeledThingsCount,
    selectedModel,
    modelStatus,
    alertState,
    fitOptions,
    trainingPercentage,
    noLabeledThingsAlert,
    handleFit,
  } = useClassificationModelAgain();

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
          noLabels={labeledThingsCount === 0}
          noTrain={!selectedModel.trainable}
          epochs={fitOptions.epochs}
          currentEpoch={currentEpoch}
        />

        {showWarning && labeledThingsCount === 0 && selectedModel.trainable && (
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
