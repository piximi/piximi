import React from "react";
import { useDispatch } from "react-redux";

import {
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

import { useTranslation } from "hooks";

import { classifierSlice } from "store/slices/classifier";
import { dataSlice } from "store/slices/data";
import { Partition } from "types";

import { ModelStatus } from "types/ModelType";
import { CustomListItemButton } from "../CustomListItemButton";
import { projectSlice } from "store/slices/project";

export const ShowPredictionItems = () => {
  const dispatch = useDispatch();

  const [labeledImagesVisible, setLabeledImagesVisible] = React.useState(true);

  const t = useTranslation();

  const toggleShowLabeledImages = () => {
    if (labeledImagesVisible) {
      dispatch(
        projectSlice.actions.setImagePartitionFilters({
          partitions: [
            Partition.Training,
            Partition.Validation,
            Partition.Unassigned,
          ],
        })
      );
    } else {
      dispatch(
        projectSlice.actions.setImagePartitionFilters({
          partitions: [],
        })
      );
    }
    setLabeledImagesVisible((isShown) => !isShown);
  };

  const clearPredictions = () => {
    dispatch(dataSlice.actions.clearPredictions({ isPermanent: true }));

    if (!labeledImagesVisible) {
      setLabeledImagesVisible(true);

      dispatch(
        projectSlice.actions.setImagePartitionFilters({
          partitions: [],
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

  return (
    <>
      <CustomListItemButton
        primaryText={t("Clear predictions")}
        onClick={clearPredictions}
        icon={<ClearIcon />}
      />
      <CustomListItemButton
        primaryText={t(
          `${labeledImagesVisible ? "Hide" : "Show"} labeled images`
        )}
        onClick={toggleShowLabeledImages}
        icon={labeledImagesVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
      />
    </>
  );
};
