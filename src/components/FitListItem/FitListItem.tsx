import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { OpenClassifierSnackbar } from "../OpenClassifierSnackbar";
import { classifierSlice } from "../../store/slices";
import { compileOptionsSelector, openedSelector } from "../../store/selectors";

export const FitListItem = () => {
  const dispatch = useDispatch();

  const compileOptions = useSelector(compileOptionsSelector);
  const opened = useSelector(openedSelector);

  const [
    openOpenClassifierSnackbar,
    setOpenOpenClassifierSnackbar,
  ] = React.useState(false);

  const callback = (batch: number, logs: any) => {
    console.info(logs);
    dispatch(
      classifierSlice.actions.updateLossHistory({
        batch: batch,
        loss: logs.loss,
      })
    );
  };

  useCallback(() => {
    console.info("useCallback");

    const payload = { opened: opened, options: compileOptions };

    dispatch(classifierSlice.actions.compile(payload));
  }, [compileOptions, dispatch, opened]);

  const onOpenClassifierSnackbar = () => {
    dispatch(
      classifierSlice.actions.fit({
        callback: callback,
        classes: 2,
        options: {
          epochs: 10,
          batchSize: 1,
          initialEpoch: 1,
        },
        compileOptions: compileOptions,
        pathname:
          "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json",
        units: 10,
      })
    );

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
