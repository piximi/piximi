import React from "react";
import { useSelector } from "react-redux";
// import { useLocation } from "react-router-dom";
import StackTrace from "stacktrace-js";

import {
  AppBar,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogContent,
  DialogContentText,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  GitHub as GitHubIcon,
} from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { SaveFittedModelDialog, SaveProjectDialog } from "sections/dialogs";

import { HotkeyContext } from "utils/common/enums";

import { ModelStatus } from "utils/models/enums";
import { APPLICATION_COLORS } from "utils/common/constants";
import { createGitHubIssue } from "utils/common/helpers";
import { AlertState } from "utils/common/types";
import { AlertType } from "utils/common/enums";
import {
  selectClassifierModelStatus,
  selectClassifierSelectedModel,
} from "store/classifier/selectors";
import {
  selectSegmenterModel,
  selectSegmenterModelStatus,
} from "store/segmenter/selectors";

export const FallBackDialog = (props: any) => {
  const error = props.error as Error;

  const [expanded, setExpanded] = React.useState(false);

  const [stackTrace, setStackTrace] = React.useState<string | undefined>(
    error.stack
  );

  React.useEffect(() => {
    if (error.stack) {
      StackTrace.fromError(error)
        .then((stacktrace) => {
          setStackTrace(
            stacktrace.map((stackFrame) => stackFrame.toString()).join("\n")
          );
        })
        .catch((err) => console.error("could not resolve stacktrace", err));
    }
  }, [error]);

  React.useEffect(() => {
    if (stackTrace) {
      process.env.NODE_ENV !== "production" && console.error(stackTrace);
    }
  }, [stackTrace]);

  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  // const routePath = useLocation().pathname;
  // const inAnnotator = routePath === "/annotator";

  const {
    onClose: onSaveClassifierDialogClose,
    onOpen: onSaveClassifierDialogOpen,
    open: openSaveClassifierDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const {
    onClose: onSaveSegmenterDialogClose,
    onOpen: onSaveSegmenterDialogOpen,
    open: openSaveSegmenterDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const selectedClassifierModel = useSelector(selectClassifierSelectedModel);
  const classifierModelStatus = useSelector(selectClassifierModelStatus);

  const selectedSegmenterModel = useSelector(selectSegmenterModel);
  const segmenterModelStatus = useSelector(selectSegmenterModelStatus);

  const errorState: AlertState = {
    alertType: AlertType.Error,
    name: "Uncaught run-time error",
    description: error.name + ": " + error.message,
    stackTrace: stackTrace,
  };

  const issueDescription =
    errorState.description +
    "\n\n**Steps to reproduce:**\n" +
    "\n\n**Stacktrace:**\n" +
    errorState.stackTrace;

  const gitHubIssueUrl =
    "https://github.com/piximi/piximi/issues/new?title=" +
    encodeURIComponent(errorState.name) +
    "&labels=" +
    "bug" +
    "&body=" +
    encodeURIComponent(issueDescription);

  return (
    <Dialog
      onClose={() => {}}
      open={true}
      fullWidth
      maxWidth="md"
      sx={{ zIndex: 1203, height: "600px" }}
    >
      <AppBar
        sx={{
          position: "sticky",
          backgroundColor: (theme) => theme.palette.error.light,
          boxShadow: "none",
          borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
        }}
      >
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ pl: 1 }}>
            {errorState.name}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={expanded ? "Hide stacktrace" : "Show stacktrace"}>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? (
                <KeyboardArrowDownIcon />
              ) : (
                <KeyboardArrowRightIcon />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Create GitHub issue">
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              onClick={() =>
                createGitHubIssue(
                  errorState.name,
                  issueDescription,
                  AlertType.Error
                )
              }
            >
              <GitHubIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box>
            <Typography sx={{ pl: 4, pb: 1, fontSize: 13 }}>
              {errorState.stackTrace}
            </Typography>
          </Box>
        </Collapse>
      </AppBar>

      <DialogContent>
        <Typography
          variant="h1"
          component="div"
          sx={{ color: (theme) => theme.palette.text.secondary }}
        >
          :(
        </Typography>

        <DialogContentText
          sx={{
            fontSize: 18,
            "& a": { color: "deepskyblue" },
          }}
        >
          <br></br>
          {"Sorry about that! Piximi ran into a problem and needs to restart."}
          <br></br>
          {"Please "}
          <a href={gitHubIssueUrl} target="_blank" rel="noreferrer">
            open a GitHub issue
          </a>
          {" or visit "}
          <a
            href="https://forum.image.sc/tag/piximi"
            target="_blank"
            rel="noreferrer"
          >
            forum.image.sc/tag/piximi
          </a>
          {" to report this error."}
          <br></br>
          <br></br>
          {"Save your data before reloading Piximi:"}
          <br></br>
          <br></br>
        </DialogContentText>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={onSaveProjectDialogOpen}>
            Save project
          </Button>
          {classifierModelStatus === ModelStatus.Trained && (
            <Button variant="outlined" onClick={onSaveClassifierDialogOpen}>
              Save classifier
            </Button>
          )}
          {segmenterModelStatus === ModelStatus.Trained && (
            <Button variant="outlined" onClick={onSaveSegmenterDialogOpen}>
              Save segmenter
            </Button>
          )}
        </Stack>

        <SaveProjectDialog
          onClose={onSaveProjectDialogClose}
          open={openSaveProjectDialog}
        />

        <SaveFittedModelDialog
          model={selectedClassifierModel}
          modelStatus={classifierModelStatus}
          onClose={onSaveClassifierDialogClose}
          open={openSaveClassifierDialog}
        />

        <SaveFittedModelDialog
          model={selectedSegmenterModel}
          modelStatus={segmenterModelStatus}
          onClose={onSaveSegmenterDialogClose}
          open={openSaveSegmenterDialog}
        />
      </DialogContent>
    </Dialog>
  );
};
