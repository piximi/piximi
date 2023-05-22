import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CircularProgress,
  Grid,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";

import { useTranslation } from "hooks";

import { DisabledListItemButton } from "components/common/list-items/DisabledListItemButton";

import { segmenterModelStatusSelector, segmenterSlice } from "store/segmenter";
import { ModelStatus } from "types/ModelType";

type EvaluateSegmenterListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const EvaluateSegmenterListItem = (
  props: EvaluateSegmenterListItemProps
) => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const modelStatus = useSelector(segmenterModelStatusSelector);

  const [waitingForResults, setWaitingForResults] = React.useState(false);

  const onEvaluate = async () => {
    setWaitingForResults(true);

    dispatch(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: ModelStatus.Evaluating,
        execSaga: true,
      })
    );
  };

  useEffect(() => {
    if (modelStatus === ModelStatus.Trained && waitingForResults) {
      setWaitingForResults(false);
    }
  }, [modelStatus, waitingForResults]);

  return (
    <Grid item xs={4}>
      <DisabledListItemButton {...props} onClick={onEvaluate}>
        <Stack sx={{ alignItems: "center" }}>
          <ListItemIcon sx={{ justifyContent: "center" }}>
            {modelStatus === ModelStatus.Evaluating ? (
              <CircularProgress disableShrink size={24} />
            ) : (
              <AssessmentIcon />
            )}
          </ListItemIcon>
          <ListItemText primary={t("Evaluate")} />
        </Stack>
      </DisabledListItemButton>
    </Grid>
  );
};
