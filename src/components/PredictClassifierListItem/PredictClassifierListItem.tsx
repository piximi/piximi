import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import React from "react";
import { useImage } from "../../hooks/useImage/useImage";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";

export const PredictClassifierListItem = () => {
  const image = useImage();

  if (!image) return <></>;

  const onPredictClick = () => {};

  return (
    <>
      <ListItem button onClick={onPredictClick}>
        <ListItemIcon>
          <LabelImportantIcon />
        </ListItemIcon>

        <ListItemText primary="Predict" />
      </ListItem>
    </>
  );
};
