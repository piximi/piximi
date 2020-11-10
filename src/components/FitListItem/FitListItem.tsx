import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import React from "react";
import { useDispatch } from "react-redux";
import { OpenClassifierSnackbar } from "../OpenClassifierSnackbar";
import { classifierSlice } from "../../store/slices";

export const FitListItem = () => {
  const dispatch = useDispatch();

  const [
    openOpenClassifierSnackbar,
    setOpenOpenClassifierSnackbar,
  ] = React.useState(false);

  const onEpochEnd = (batch: number, logs: any) => {
    console.info(logs);

    const payload = { batch: batch, loss: logs.loss };

    dispatch(classifierSlice.actions.updateLossHistory(payload));
  };

  const onOpenClassifierSnackbar = () => {
    dispatch(classifierSlice.actions.fit({ onEpochEnd: onEpochEnd }));

    setOpenOpenClassifierSnackbar(true);
  };

  const onCloseOpenClassifierSnackbar = () => {
    setOpenOpenClassifierSnackbar(false);
  };

  const onFitClick = () => {
    onOpenClassifierSnackbar();
  };

  return (
    <React.Fragment>
      <ListItem button onClick={onFitClick}>
        <ListItemIcon>
          <ScatterPlotIcon />
        </ListItemIcon>

        <ListItemText primary="Fit" />
      </ListItem>

      <OpenClassifierSnackbar
        onClose={onCloseOpenClassifierSnackbar}
        open={openOpenClassifierSnackbar}
      />
    </React.Fragment>
  );
};
