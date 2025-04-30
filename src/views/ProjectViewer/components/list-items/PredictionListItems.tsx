import React from "react";
import { useDispatch } from "react-redux";

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

import { ModelStatus, Partition } from "utils/models/enums";
import { List } from "@mui/material";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";

export const PredictionListItems = () => {
  const dispatch = useDispatch();
  const [labeledImagesVisible, setLabeledImagesVisible] = React.useState(true);
  const { setModelStatus, clearPredictions, acceptPredictions } =
    useClassifierStatus();

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

  const handleClearPredictions = () => {
    clearPredictions();

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
  const handleAcceptPredictions = () => {
    acceptPredictions();
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
        onClick={handleClearPredictions}
        icon={
          <ClearIcon
            sx={(theme) => ({ fontSize: theme.typography.body1.fontSize })}
          />
        }
        primaryTypographyProps={{ variant: "body2" }}
      />
      <ListItemHoldButton
        onHoldComplete={handleAcceptPredictions}
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
