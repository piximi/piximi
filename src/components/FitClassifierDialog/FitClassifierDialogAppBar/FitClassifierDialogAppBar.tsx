import * as React from "react";
import { createStyles, makeStyles } from "@mui/styles";
import { AppBar, IconButton, Theme, Toolbar, Tooltip } from "@mui/material";
import { ArrowBack, PlayCircleOutline, Stop } from "@mui/icons-material";
import { compiledSelector } from "../../../store/selectors";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../store/slices";
import { trainingFlagSelector } from "../../../store/selectors/trainingFlagSelector";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    leftIcon: {
      marginRight: theme.spacing(1),
    },
    button: {},
    grow: {
      flexGrow: 1,
    },
    appBar: {
      position: "relative",
      backgroundColor: "transparent",
      boxShadow: "none",
      borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    },
    appBarShift: {},
    appBarShiftLeft: {},
  })
);

export const FitClassifierDialogAppBar = (props: any) => {
  const { closeDialog, fit, disableFitting } = props;

  const classes = useStyles({});

  const dispatch = useDispatch();

  const compiled = useSelector(compiledSelector);
  const training = useSelector(trainingFlagSelector);

  const onStopFitting = () => {
    if (!compiled) return;
    compiled.stopTraining = true;
    dispatch(classifierSlice.actions.updateCompiled({ compiled: compiled }));
  };

  return (
    <AppBar className={classes.appBar}>
      <Toolbar>
        <Tooltip title="Close Dialog" placement="bottom">
          <IconButton
            edge="start"
            color="primary"
            onClick={closeDialog}
            aria-label="Close"
            href={""}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <div className={classes.grow} />

        <Tooltip
          title={
            disableFitting
              ? "Plaese label images before fitting a model."
              : "Fit the model"
          }
          placement="bottom"
        >
          <span>
            <IconButton
              className={classes.button}
              onClick={fit}
              href={""}
              disabled={disableFitting}
            >
              <PlayCircleOutline />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Stop fitting the model" placement="bottom">
          <span>
            <IconButton
              className={classes.button}
              onClick={onStopFitting}
              href={""}
              disabled={!training}
            >
              <Stop />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
