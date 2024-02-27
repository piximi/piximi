import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
} from "@mui/icons-material";

import { useTranslation } from "hooks";

import { classifierSlice } from "store/slices/classifier";
import { Partition } from "types";

import { ModelStatus } from "types/ModelType";
import { CustomListItemButton } from "../CustomListItemButton";
import { projectSlice } from "store/slices/project";
import { ListItemHoldButton } from "../ListItemHoldButton";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { selectActiveKind } from "store/slices/project/selectors";

export const PredictionListItemsNew = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKind);

  const [labeledImagesVisible, setLabeledImagesVisible] = React.useState(true);

  const t = useTranslation();

  const toggleShowLabeledImages = () => {
    if (labeledImagesVisible) {
      dispatch(
        projectSlice.actions.addThingPartitionFilters({
          partitions: [
            Partition.Training,
            Partition.Validation,
            Partition.Unassigned,
          ],
        })
      );
    } else {
      dispatch(
        projectSlice.actions.removeThingPartitionFilters({
          partitions: "all",
        })
      );
    }
    setLabeledImagesVisible((isShown) => !isShown);
  };

  const clearPredictions = () => {
    dispatch(
      newDataSlice.actions.clearPredictions({
        kind: activeKind,
        isPermanent: true,
      })
    );

    if (!labeledImagesVisible) {
      setLabeledImagesVisible(true);

      dispatch(
        projectSlice.actions.removeThingPartitionFilters({
          partitions: "all",
        })
      );
    }

    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Trained,
        execSaga: false,
      })
    );
  };
  const acceptPredictions = () => {
    dispatch(
      newDataSlice.actions.acceptPredictions({
        kind: activeKind,
        isPermanent: true,
      })
    );
    dispatch(
      classifierSlice.actions.updateModelStatusNew({
        modelStatus: ModelStatus.Trained,
      })
    );
    dispatch(
      projectSlice.actions.removeThingPartitionFilters({
        partitions: "all",
      })
    );
  };

  return (
    <>
      <CustomListItemButton
        primaryText={t(
          `${labeledImagesVisible ? "Hide" : "Show"} labeled images`
        )}
        onClick={toggleShowLabeledImages}
        icon={labeledImagesVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
      />
      <CustomListItemButton
        primaryText={t("Clear predictions")}
        onClick={clearPredictions}
        icon={<ClearIcon />}
      />
      <ListItemHoldButton
        onHoldComplete={acceptPredictions}
        primaryText="Accept Predictions (Hold)"
        icon={<CheckIcon />}
        holdDuration={100}
      />
    </>
  );
};
