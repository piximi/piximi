import * as React from "react";
import { ArrowBack, PlayCircleOutline } from "@mui/icons-material";
import { AppBar, IconButton, Toolbar, Tooltip } from "@mui/material";

type DialogAppBarProps = {
  closeDialog: () => void;
  evaluate: () => void;
};

export const PredictSegmenterDialogAppBar = (props: DialogAppBarProps) => {
  const { closeDialog, evaluate } = props;

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

        <Tooltip title="Evaluate the model" placement="bottom">
          <IconButton onClick={evaluate} href={""}>
            <PlayCircleOutline />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
