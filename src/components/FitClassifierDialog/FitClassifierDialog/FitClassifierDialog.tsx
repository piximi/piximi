import { FitClassifierDialogAppBar } from "../FitClassifierDialogAppBar";
import { OptimizerSettingsListItem } from "../OptimizerSettingsListItem/OptimizerSettingsListItem";
import { DatasetSettingsListItem } from "../DatasetSettingsListItem/DatasetSettingsListItem";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice, projectSlice } from "../../../store/slices";
import { Dialog, DialogContent, List } from "@mui/material";
import { ArchitectureSettingsListItem } from "../ArchitectureSettingsListItem";
import { PreprocessingSettingsListItem } from "../../PreprocessingSettingsListItem/PreprocessingSettingsListItem";
import { DialogTransition } from "../../DialogTransition";
import {
  categorizedImagesSelector,
  compiledSelector,
  trainingPercentageSelector,
} from "../../../store/selectors";
import { ImageType } from "../../../types/ImageType";
import * as _ from "lodash";
import { Partition } from "../../../types/Partition";
import { useEffect, useState } from "react";
import { TrainingHistoryPlot } from "../TrainingHistoryPlot/TrainingHistoryPlot";
import { ModelSummaryTable } from "./ModelSummary/ModelSummary";
import { epochsSelector } from "store/selectors/epochsSelector";
import { AlertStateType, AlertType } from "types/AlertStateType";
import { AlertDialog } from "components/AlertDialog/AlertDialog";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = (props: FitClassifierDialogProps) => {
  const { closeDialog, openedDialog } = props;

  const [currentEpoch, setCurrentEpoch] = useState<number>(0);

  const [noCategorizedImagesAlert, setNoCategorizedImagesAlert] =
    useState<boolean>(false);
  const [alertState, setAlertState] = useState<AlertStateType>({
    alertType: AlertType.Info,
    name: "No labeled images",
    description: "Please label images to train a model.",
  });
  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [showPlots, setShowPlots] = useState<boolean>(false);

  const [trainingAccuracy, setTrainingAccuracy] = useState<
    { x: number; y: number }[]
  >([]);
  const [validationAccuracy, setValidationAccuracy] = useState<
    { x: number; y: number }[]
  >([]);
  const [trainingLoss, setTrainingLoss] = useState<{ x: number; y: number }[]>(
    []
  );
  const [validationLoss, setValidationLoss] = useState<
    { x: number; y: number }[]
  >([]);

  const trainingPercentage = useSelector(trainingPercentageSelector);
  const categorizedImages = useSelector(categorizedImagesSelector);
  const compiledModel = useSelector(compiledSelector);

  const epochs = useSelector(epochsSelector);

  useEffect(() => {
    setNoCategorizedImagesAlert(categorizedImages.length === 0);
  }, [categorizedImages]);

  const dispatch = useDispatch();

  const trainingHistoryCallback = (epoch: number, logs: any) => {
    const epochCount = epoch + 1;
    setCurrentEpoch(epochCount);
    setTrainingAccuracy((prevState) =>
      prevState.concat({ x: epochCount, y: logs.categoricalAccuracy })
    );
    setValidationAccuracy((prevState) =>
      prevState.concat({ x: epochCount, y: logs.val_categoricalAccuracy })
    );
    setTrainingLoss((prevState) =>
      prevState.concat({ x: epochCount, y: logs.loss })
    );
    setValidationLoss((prevState) =>
      prevState.concat({ x: epochCount, y: logs.val_loss })
    );

    setShowPlots(true);
  };

  const cleanUpStates = () => {
    setTrainingAccuracy([]);
    setValidationAccuracy([]);
    setTrainingLoss([]);
    setValidationLoss([]);
    setShowPlots(false);

    setCurrentEpoch(0);
  };

  const onFit = async () => {
    cleanUpStates();

    //first assign train and val partition to all categorized images
    const categorizedImagesIds = _.shuffle(categorizedImages).map(
      (image: ImageType) => {
        return image.id;
      }
    );

    //separate ids into train and val datasets
    const trainDataLength = Math.round(
      trainingPercentage * categorizedImagesIds.length
    );
    const valDataLength = categorizedImagesIds.length - trainDataLength;

    const trainDataIds = _.take(categorizedImagesIds, trainDataLength);
    const valDataIds = _.takeRight(categorizedImagesIds, valDataLength);

    dispatch(
      projectSlice.actions.updateImagesPartition({
        ids: trainDataIds,
        partition: Partition.Training,
      })
    );
    dispatch(
      projectSlice.actions.updateImagesPartition({
        ids: valDataIds,
        partition: Partition.Validation,
      })
    );

    dispatch(
      classifierSlice.actions.fit({
        onEpochEnd: trainingHistoryCallback,
      })
    );
  };

  return (
    <Dialog
      fullScreen
      onClose={closeDialog}
      open={openedDialog}
      TransitionComponent={DialogTransition}
      style={{ zIndex: 1203 }}
    >
      <FitClassifierDialogAppBar
        closeDialog={closeDialog}
        fit={onFit}
        disableFitting={noCategorizedImagesAlert}
        epochs={epochs}
        currentEpoch={currentEpoch}
      />

      {noCategorizedImagesAlert && showWarning && (
        <AlertDialog
          setShowAlertDialog={setShowWarning}
          alertState={alertState}
        />
      )}

      <DialogContent>
        <List dense>
          <PreprocessingSettingsListItem
            closeDialog={closeDialog}
            openedDialog={openedDialog}
          />

          <ArchitectureSettingsListItem />

          <OptimizerSettingsListItem />

          <DatasetSettingsListItem />
        </List>

        {showPlots && (
          <div>
            <TrainingHistoryPlot
              metric={"accuracy"}
              trainingValues={trainingAccuracy}
              validationValues={validationAccuracy}
            />

            <TrainingHistoryPlot
              metric={"loss"}
              trainingValues={trainingLoss}
              validationValues={validationLoss}
              dynamicYRange={true}
            />
          </div>
        )}

        {compiledModel && (
          <div>
            <ModelSummaryTable compiledModel={compiledModel} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
