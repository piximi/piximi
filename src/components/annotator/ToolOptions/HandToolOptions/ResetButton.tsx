import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "../../../../hooks/useTranslation";
import { imageViewerSlice } from "../../../../store/slices";

export const ResetButton = () => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const onResetClick = () => {
    dispatch(
      imageViewerSlice.actions.setStagePosition({
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
