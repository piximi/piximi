import React from "react";
import { useDispatch } from "react-redux";

import {
  CircularProgress,
  Grid,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";

import { useTranslation } from "hooks";

import { DisabledListItemButton } from "components/common/DisabledListItemButton";

import { segmenterSlice } from "store/segmenter";

type EvaluateSegmenterListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const EvaluateSegmenterListItem = (
  props: EvaluateSegmenterListItemProps
) => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);

  const onEvaluate = async () => {
    setIsEvaluating(true);
    dispatch(segmenterSlice.actions.evaluateSegmenter({}));
  };

  return (
    <Grid item xs={4}>
      <DisabledListItemButton {...props} onClick={onEvaluate}>
        <Stack sx={{ alignItems: "center" }}>
          <ListItemIcon sx={{ justifyContent: "center" }}>
            {isEvaluating ? (
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
