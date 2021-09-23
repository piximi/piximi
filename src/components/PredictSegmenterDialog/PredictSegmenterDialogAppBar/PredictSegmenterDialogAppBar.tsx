import * as React from "react";
import { ArrowBack, PlayCircleOutline } from "@material-ui/icons";
import { useStyles } from "./PredictSegmentorDialogAppBar.css";
import { AppBar, IconButton, Toolbar, Tooltip } from "@material-ui/core";

type DialogAppBarProps = {
  closeDialog: () => void;
  evaluate: () => void;
};

export const PredictSegmenterDialogAppBar = (props: DialogAppBarProps) => {
  const { closeDialog, evaluate } = props;

  const classes = useStyles({});

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

        <Tooltip title="Evaluate the model" placement="bottom">
          <IconButton className={classes.button} onClick={evaluate} href={""}>
            <PlayCircleOutline />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
