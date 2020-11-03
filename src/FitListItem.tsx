import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { OpenClassifierSnackbar } from "./OpenClassifierSnackbar";
import {
  categoriesSelector,
  categorizedImagesSelector,
  compiledSelector,
  compileOptionsSelector,
  dataSelector,
  fitOptionsSelector,
  openedSelector,
  validationDataSelector,
  validationPercentageSelector,
} from "./store/selectors";
import { classifierSlice } from "./store/slices";

export const FitListItem = () => {
  const dispatch = useDispatch();

  const categories = useSelector(categoriesSelector);
  const compileOptions = useSelector(compileOptionsSelector);
  const compiled = useSelector(compiledSelector);
  const data = useSelector(dataSelector);
  const fitOptions = useSelector(fitOptionsSelector);
  const images = useSelector(categorizedImagesSelector);
  const opened = useSelector(openedSelector);
  const validationData = useSelector(validationDataSelector);
  const validationPercentage = useSelector(validationPercentageSelector);

  const [
    openOpenClassifierSnackbar,
    setOpenOpenClassifierSnackbar,
  ] = React.useState(false);

  const callback = (batch: number, logs: any) => {
    dispatch(
      classifierSlice.actions.updateLossHistory({
        batch: batch,
        loss: logs.loss,
      })
    );
    if (logs.val_loss) {
      dispatch(
        classifierSlice.actions.updateValidationLossHistory({
          batch: batch,
          loss: logs.val_loss,
        })
      );
    }
  };

  const onOpenClassifierSnackbar = () => {
    const pathname =
      "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

    dispatch(
      classifierSlice.actions.open({
        pathname: pathname,
        classes: 10,
        units: 100,
      })
    );
    // dispatch(compileAction({ opened: opened, options: compileOptions}));
    // dispatch(
    //   preprocessModelAction({
    //     images: images,
    //     categories: categories,
    //     options: { validationPercentage: validationPercentage },
    //   })
    // );
    // dispatch(fitAction({compiled: compiled, data: data, validationData: validationData, options: fitOptions, callback: callback}));

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
