import React from "react";
import { useSelector } from "react-redux";
import { fromError } from "stacktrace-js";

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

import { SaveProjectDialog } from "./SaveProjectDialog";

import { createGitHubIssue } from "utils/logUtils";

import { APPLICATION_COLORS } from "utils/constants";
import { HotkeyContext } from "utils/enums";
import { AlertType } from "utils/enums";

import { AlertState } from "utils/types";
import classifierHandler from "utils/models/classification/classifierHandler";
import { saveAs } from "file-saver";
import { selectProjectName } from "store/project/selectors";

export const FallbackDialog = (props: any) => {
  const error = props.error as Error;
  const projectName = useSelector(selectProjectName);

  const [expanded, setExpanded] = React.useState(false);

  const [stackTrace, setStackTrace] = React.useState<string | undefined>(
    error.stack,
  );

  React.useEffect(() => {
    if (error.stack) {
      fromError(error)
        .then((stacktrace) => {
          setStackTrace(
            stacktrace.map((stackFrame) => stackFrame.toString()).join("\n"),
          );
        })
        .catch((err) => console.error("could not resolve stacktrace", err));
    }
  }, [error]);

  React.useEffect(() => {
    if (stackTrace) {
      import.meta.env.NODE_ENV !== "production" && console.error(stackTrace);
    }
  }, [stackTrace]);

  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  // const routePath = useLocation().pathname;
  // const inAnnotator = routePath === "/annotator";

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

  const handleSaveClassifiers = async () => {
    const modelsZip = classifierHandler.zipModels();
    modelsZip.generateAsync({ type: "blob" }).then((blob) => {
      saveAs(blob, `${projectName}-classifiers.zip`);
    });
  };

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
                  AlertType.Error,
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
            Save Project
          </Button>
          {classifierHandler.getModelNames().length > 0 && (
            <Button variant="outlined" onClick={handleSaveClassifiers}>
              Save Classifier
            </Button>
          )}
        </Stack>

        <SaveProjectDialog
          onClose={onSaveProjectDialogClose}
          open={openSaveProjectDialog}
        />
      </DialogContent>
    </Dialog>
  );
};
