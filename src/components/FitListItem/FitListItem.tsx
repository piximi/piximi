import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import React from "react";
import { useDispatch } from "react-redux";
import { classifierSlice } from "../../store/slices";
import { TrainingClassifierSnackbar } from "../TrainingClassifierSnackbar";

export const FitListItem = () => {
  const dispatch = useDispatch();

  const [
    openOpenClassifierSnackbar,
    setOpenOpenClassifierSnackbar,
  ] = React.useState(false);

  const [epoch, setEpoch] = React.useState<number>(0);

  const [loss, setLoss] = React.useState<number>(0);

  const onEpochEnd = (index: number, logs: any) => {
    setEpoch(index);
    setLoss(logs.loss);
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

      <TrainingClassifierSnackbar
        epoch={epoch}
        loss={loss}
        onClose={onCloseOpenClassifierSnackbar}
        open={openOpenClassifierSnackbar}
      />
    </React.Fragment>
  );
};
