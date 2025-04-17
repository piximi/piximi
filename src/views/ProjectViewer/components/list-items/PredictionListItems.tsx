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

import { projectSlice } from "store/project";
import { dataSlice } from "store/data/dataSlice";
import { selectActiveKindId } from "store/project/selectors";

import { ModelStatus, Partition } from "utils/models/enums";
import { List } from "@mui/material";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";

export const PredictionListItems = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const [labeledImagesVisible, setLabeledImagesVisible] = React.useState(true);
  const { setModelStatus } = useClassifierStatus();

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

    setModelStatus(ModelStatus.Idle);
  };
  const acceptPredictions = () => {
    dispatch(
      dataSlice.actions.acceptPredictions({
        kind: activeKindId,
      }),
    );
    setModelStatus(ModelStatus.Idle);
    dispatch(
      projectSlice.actions.removeThingPartitionFilters({
        partitions: "all",
      }),
    );
  };

  return (
    <List dense>
      <CustomListItemButton
        primaryText={t(
          `${labeledImagesVisible ? "Hide" : "Show"} labeled images`,
        )}
        onClick={toggleShowLabeledImages}
        icon={
          labeledImagesVisible ? (
            <VisibilityOffIcon
              sx={(theme) => ({ fontSize: theme.typography.body1.fontSize })}
            />
          ) : (
            <VisibilityIcon
              sx={(theme) => ({ fontSize: theme.typography.body1.fontSize })}
            />
          )
        }
        primaryTypographyProps={{ variant: "body2" }}
      />
      <CustomListItemButton
        primaryText={t("Clear predictions")}
        onClick={clearPredictions}
        icon={
          <ClearIcon
            sx={(theme) => ({ fontSize: theme.typography.body1.fontSize })}
          />
        }
        primaryTypographyProps={{ variant: "body2" }}
      />
      <ListItemHoldButton
        onHoldComplete={acceptPredictions}
        primaryText="Accept Predictions (Hold)"
        icon={
          <CheckIcon
            sx={(theme) => ({ fontSize: theme.typography.body1.fontSize })}
          />
        }
        holdDuration={100}
        primaryTypographyProps={{ variant: "body2" }}
      />
    </List>
  );
};
