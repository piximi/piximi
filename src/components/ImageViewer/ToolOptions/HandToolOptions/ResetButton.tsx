import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { useDispatch } from "react-redux";
import { applicationSlice } from "../../../../annotator/store/slices";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";

export const ResetButton = () => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const onResetClick = () => {
    dispatch(
      applicationSlice.actions.setStagePosition({
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
