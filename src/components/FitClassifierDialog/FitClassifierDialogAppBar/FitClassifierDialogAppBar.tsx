import * as React from "react";
import { AppBar, Box, IconButton, Toolbar, Tooltip } from "@mui/material";
import { ArrowBack, PlayCircleOutline, Stop } from "@mui/icons-material";
import { compiledSelector } from "../../../store/selectors";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../store/slices";
import { trainingFlagSelector } from "../../../store/selectors/trainingFlagSelector";

export const FitClassifierDialogAppBar = (props: any) => {
  const { closeDialog, fit, disableFitting } = props;

  const dispatch = useDispatch();

  const compiled = useSelector(compiledSelector);
  const training = useSelector(trainingFlagSelector);

  const onStopFitting = () => {
    if (!compiled) return;
    compiled.stopTraining = true;
    dispatch(classifierSlice.actions.updateCompiled({ compiled: compiled }));
  };

  return (
    <AppBar
      sx={{
        position: "relative",
        backgroundColor: "transparent",
        boxShadow: "none",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
      }}
    >
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

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip
          title={
            disableFitting
              ? "Plaese label images before fitting a model."
              : "Fit the model"
          }
          placement="bottom"
        >
          <span>
            <IconButton onClick={fit} href={""} disabled={disableFitting}>
              <PlayCircleOutline />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Stop fitting the model" placement="bottom">
          <span>
            <IconButton onClick={onStopFitting} href={""} disabled={!training}>
              <Stop />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
