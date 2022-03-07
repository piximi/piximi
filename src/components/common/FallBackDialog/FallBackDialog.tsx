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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import GitHubIcon from "@mui/icons-material/GitHub";
import { AlertStateType, AlertType } from "types/AlertStateType";
import { createGitHubIssue } from "utils/createGitHubIssue";
import { SaveClassifierDialog } from "components/SaveClassifierDialog/SaveClassifierDialog";
import { SaveProjectDialog } from "components/SaveProjectDialog/SaveProjectDialog";
import { useDialog } from "hooks/useDialog/useDialog";
import React from "react";

const popupState = {
  close: () => {},
};

export const FallBackDialog = (props: any) => {
  const error = props.error as Error;
  var stackTrace = error.stack;

  const [expanded, setExpanded] = React.useState(false);

  const {
    onClose: onSaveProjectDialogClose,
    onOpen: onSaveProjectDialogOpen,
    open: openSaveProjectDialog,
  } = useDialog();

  const {
    onClose: onSaveClassifierDialogClose,
    onOpen: onSaveClassifierDialogOpen,
    open: openSaveClassifierDialog,
  } = useDialog();

  const errorState: AlertStateType = {
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
    "https://github.com/piximi/prototype/issues/new?title=" +
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
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
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
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
          <Button variant="outlined" onClick={onSaveClassifierDialogOpen}>
            Save classifier
          </Button>
        </Stack>

        <SaveProjectDialog
          onClose={onSaveProjectDialogClose}
          open={openSaveProjectDialog}
          popupState={popupState}
        />

        <SaveClassifierDialog
          onClose={onSaveClassifierDialogClose}
          open={openSaveClassifierDialog}
          popupState={popupState}
        />
      </DialogContent>
    </Dialog>
  );
};
