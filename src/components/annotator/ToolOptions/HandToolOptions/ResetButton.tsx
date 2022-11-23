import React from "react";
import { useDispatch } from "react-redux";

import { ListItem, ListItemText } from "@mui/material";

import { useTranslation } from "hooks";

import { setOffset } from "store/annotator";

export const ResetButton = () => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const onResetClick = () => {
    dispatch(
      setOffset({
        offset: { x: 0, y: 0 },
      })
    );
  };
  return (
    <ListItem button onClick={onResetClick}>
      <ListItemText>{t("Reset position")}</ListItemText>
    </ListItem>
  );
};
