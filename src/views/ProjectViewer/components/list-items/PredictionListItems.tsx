import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
} from "@mui/icons-material";

import { useTranslation } from "hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { ListItemHoldButton } from "components/ui/ListItemHoldButton";

import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { dataSlice } from "store/data/dataSlice";
import { selectActiveKindId } from "store/project/selectors";

import { ModelStatus, Partition } from "utils/models/enums";
import { selectClassifierModelNameOrArch } from "store/classifier/reselectors";

export const PredictionListItems = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const modelNameOrArch = useSelector(selectClassifierModelNameOrArch);
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
        }),
      );
    } else {
      dispatch(
        projectSlice.actions.removeThingPartitionFilters({
          partitions: "all",
        }),
      );
    }
    setLabeledImagesVisible((isShown) => !isShown);
  };

  const clearPredictions = () => {
    dispatch(
      dataSlice.actions.clearPredictions({
        kind: activeKindId,
      }),
    );

    if (!labeledImagesVisible) {
      setLabeledImagesVisible(true);

      dispatch(
        projectSlice.actions.removeThingPartitionFilters({
          partitions: "all",
        }),
      );
    }

    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Trained,
        kindId: activeKindId,
        nameOrArch: modelNameOrArch,
      }),
    );
  };
  const acceptPredictions = () => {
    dispatch(
      dataSlice.actions.acceptPredictions({
        kind: activeKindId,
      }),
    );
    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Trained,
        kindId: activeKindId,
        nameOrArch: modelNameOrArch,
      }),
    );
    dispatch(
      projectSlice.actions.removeThingPartitionFilters({
        partitions: "all",
      }),
    );
  };

  return (
    <>
      <CustomListItemButton
        primaryText={t(
          `${labeledImagesVisible ? "Hide" : "Show"} labeled images`,
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
