import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { OpenClassifierSnackbar } from "../OpenClassifierSnackbar";
import { classifierSlice } from "../../store/slices";
import { createdCategoriesSelector } from "../../store/selectors";
import { categorizedImagesSelector } from "../../store/selectors";
import { compileOptionsSelector } from "../../store/selectors";
import { compiledSelector } from "../../store/selectors";
import { dataSelector } from "../../store/selectors";
import { fitOptionsSelector } from "../../store/selectors";
import { openedSelector } from "../../store/selectors";
import { validationDataSelector } from "../../store/selectors";
import { validationPercentageSelector } from "../../store/selectors";

export const FitListItem = () => {
  const dispatch = useDispatch();

  const categories = useSelector(createdCategoriesSelector);
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

  useCallback(() => {
    console.info("useCallback");

    const payload = { opened: opened, options: compileOptions };

    dispatch(classifierSlice.actions.compile(payload));
  }, [compileOptions, dispatch, opened]);

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
