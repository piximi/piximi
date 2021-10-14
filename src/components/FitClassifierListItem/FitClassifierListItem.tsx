import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import React from "react";
import { useDialog } from "../../hooks";
import { FitClassifierDialog } from "../FitClassifierDialog/FitClassifierDialog";
import { useSelector } from "react-redux";
import { categoriesSelector, imagesSelector } from "../../store/selectors";

export const FitClassifierListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  const categories = useSelector(categoriesSelector);
  const images = useSelector(imagesSelector);

  const onFitClick = () => {
    onOpen();
  };

  return (
    <>
      <ListItem button onClick={onFitClick}>
        <ListItemIcon>
          <ScatterPlotIcon />
        </ListItemIcon>

        <ListItemText primary="Fit" />
      </ListItem>
      <FitClassifierDialog
        openedDialog={open}
        openedDrawer={true}
        closeDialog={onClose}
      />
    </>
  );
};
