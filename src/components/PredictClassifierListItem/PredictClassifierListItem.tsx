import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import React from "react";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useDispatch } from "react-redux";
import { classifierSlice } from "../../store/slices";

export const PredictClassifierListItem = () => {
  const dispatch = useDispatch();
  const onPredict = async () => {
    dispatch(classifierSlice.actions.predict({}));
  };

  return (
    <>
      <ListItem>
        <ListItemIcon>
          <LabelImportantIcon />
        </ListItemIcon>
        <ListItemText primary="Predict" />
        <IconButton onClick={onPredict} edge="end">
          <PlayArrowIcon />
        </IconButton>
      </ListItem>
    </>
  );
};
