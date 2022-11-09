import React from "react";
import { useDispatch } from "react-redux";

import { ListItem, ListItemText } from "@mui/material";

import { useTranslation } from "hooks";

import { AnnotatorSlice } from "store/annotator";

export const ResetButton = () => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const onResetClick = () => {
    dispatch(
      AnnotatorSlice.actions.setStagePosition({
        stagePosition: { x: 0, y: 0 },
      })
    );
  };
  return (
    <ListItem button onClick={onResetClick}>
      <ListItemText>{t("Reset position")}</ListItemText>
    </ListItem>
  );
};
