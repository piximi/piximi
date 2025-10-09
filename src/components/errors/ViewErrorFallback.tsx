import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { SaveProjectDialog } from "components/dialogs/SaveProjectDialog";

import { createGitHubIssue } from "utils/logUtils";

import { APPLICATION_COLORS } from "utils/constants";
import { HotkeyContext } from "utils/enums";
import { AlertType } from "utils/enums";

import { AlertState } from "utils/types";
import classifierHandler from "utils/models/classification/classifierHandler";
import { saveAs } from "file-saver";
import { selectProjectName } from "store/project/selectors";
import { FallbackProps } from "react-error-boundary";

type ViewErrorFallbackProps = FallbackProps & {
  viewName: string;
  returnRoute?: string;
  returnLabel?: string;
};

/**
 * Enhanced error fallback component for view-level errors.
 * Extends FallbackDialog with navigation options to recover from errors.
 */
export const ViewErrorFallback = (props: ViewErrorFallbackProps) => {
  const { error, viewName, returnRoute = "/project", returnLabel } = props;
  const projectName = useSelector(selectProjectName);
  const navigate = useNavigate();

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

  const errorState: AlertState = {
    alertType: AlertType.Error,
    name: `Error in ${viewName}`,
    description: error.name + ": " + error.message,
    stackTrace: stackTrace,
  };

  const issueDescription =
    errorState.description +
    "\n\n**View:** " +
    viewName +
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

  const handleReturnToView = () => {
    navigate(returnRoute);
  };

  const handleReturnToHome = () => {
    navigate("/");
  };

  const defaultReturnLabel = returnRoute === "/project" ? "Project" : "View";

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
          {`Sorry about that! The ${viewName} encountered a problem.`}
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
          {"You can save your data and navigate away from this view:"}
          <br></br>
          <br></br>
        </DialogContentText>

        <Stack direction="column" spacing={2}>
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

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleReturnToView}
              startIcon={<ArrowBackIcon />}
            >
              {`Return to ${returnLabel || defaultReturnLabel}`}
            </Button>
            <Button
              variant="outlined"
              onClick={handleReturnToHome}
              startIcon={<HomeIcon />}
            >
              Return to Welcome Screen
            </Button>
          </Stack>
        </Stack>

        <SaveProjectDialog
          onClose={onSaveProjectDialogClose}
          open={openSaveProjectDialog}
        />
      </DialogContent>
    </Dialog>
  );
};
