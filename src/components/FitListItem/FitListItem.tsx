import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { OpenClassifierSnackbar } from "../OpenClassifierSnackbar";
import { classifierSlice } from "../../store/slices";
import {
  compileOptionsSelector,
  createdCategoriesSelector,
  imagesSelector,
} from "../../store/selectors";
import { openedSelector } from "../../store/selectors";

export const FitListItem = () => {
  const dispatch = useDispatch();

  const compileOptions = useSelector(compileOptionsSelector);
  const opened = useSelector(openedSelector);

  const images = useSelector(imagesSelector);
  const categories = useSelector(createdCategoriesSelector);

  const [
    openOpenClassifierSnackbar,
    setOpenOpenClassifierSnackbar,
  ] = React.useState(false);

  useCallback(() => {
    console.info("useCallback");

    const payload = { opened: opened, options: compileOptions };

    dispatch(classifierSlice.actions.compile(payload));
  }, [compileOptions, dispatch, opened]);

  const onOpenClassifierSnackbar = () => {
    dispatch(
      classifierSlice.actions.preprocess({
        images: images,
        categories: categories,
        options: { validationPercentage: 0.0 },
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
