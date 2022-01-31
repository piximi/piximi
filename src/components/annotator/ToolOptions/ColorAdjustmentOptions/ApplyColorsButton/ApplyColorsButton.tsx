import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { activeImageColorsSelector } from "../../../../../store/selectors/activeImageColorsSelector";
import { imageViewerSlice } from "../../../../../store/slices";

export const ApplyColorsButton = () => {
  const activeColors = useSelector(activeImageColorsSelector);
  const dispatch = useDispatch();

  const onApplyColorsClick = () => {
    dispatch(
      imageViewerSlice.actions.setCurrentColors({ currentColors: activeColors })
    );
  };

  return (
    <ListItem button onClick={onApplyColorsClick}>
      <ListItemText>{"Apply to all opened and future images"}</ListItemText>
    </ListItem>
  );
};
