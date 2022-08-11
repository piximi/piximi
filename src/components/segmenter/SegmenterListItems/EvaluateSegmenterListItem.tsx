import React from "react";
import { useDispatch } from "react-redux";

import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";

import { useTranslation } from "hooks";
import { DisabledListItem } from "components/common/DisabledListItem";

import { segmenterSlice } from "store/slices";

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
    <>
      <DisabledListItem {...props}>
        <ListItem button onClick={onEvaluate} disablePadding>
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary={t("Evaluate Segmenter")} />
        </ListItem>

        {isEvaluating && <CircularProgress disableShrink size={20} />}
      </DisabledListItem>
    </>
  );
};
