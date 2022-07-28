import React from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Collapse,
  IconButton,
  PaletteColor,
  styled,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import GitHubIcon from "@mui/icons-material/GitHub";
import { AlertStateType, AlertType } from "types/AlertStateType";

import { createGitHubIssue } from "utils/createGitHubIssue";
import { usePreferredMuiTheme } from "hooks/useTheme/usePreferredMuiTheme";

import { applicationSlice } from "store/slices";

type AlertDialogProps = {
  alertState: AlertStateType;
  setShowAlertDialog?: (show: boolean) => void;
};

export const AlertDialog = ({
  alertState,
  setShowAlertDialog = undefined,
}: AlertDialogProps) => {
  const dispatch = useDispatch();
  const theme = usePreferredMuiTheme();

  const [expanded, setExpanded] = React.useState(false);
  const [showCreateGitHubIssue, setShowCreateGitHubIssue] =
    React.useState(false);
  const [colorTheme, setColorTheme] = React.useState<PaletteColor>(
    theme.palette.primary
  );
  const [errorStateIcon, setErrorStateIcon] = React.useState<JSX.Element>();
  const [issueDescription, setIssueDescription] = React.useState("");

  React.useEffect(() => {
    switch (alertState.alertType) {
      case AlertType.Error:
        setErrorStateIcon(<ErrorOutlineIcon />);
        setColorTheme(theme.palette.error);
        setShowCreateGitHubIssue(true);
        setIssueDescription(
          alertState.description +
            "\n\n**Steps to reproduce:**\n" +
            "\n\n**Stacktrace:**\n" +
            alertState.stackTrace
        );
        break;
      case AlertType.Warning:
        setErrorStateIcon(<WarningAmberOutlinedIcon />);
        setColorTheme(theme.palette.warning);
        setShowCreateGitHubIssue(true);
        setIssueDescription(alertState.description);
        break;
      case AlertType.Info:
        setErrorStateIcon(<InfoOutlinedIcon />);
        setColorTheme(theme.palette.info);
        break;
      default:
        setErrorStateIcon(<InfoOutlinedIcon />);
    }
  }, [alertState, theme]);

  const StyledToolbar = styled(Toolbar)(() => ({
    backgroundColor: colorTheme?.light,
    color: colorTheme?.contrastText,
    "@media all": {
      minHeight: "10px",
    },
  }));

  const closeAlertDialog = () => {
    if (setShowAlertDialog) {
      setShowAlertDialog(false);
    } else {
      dispatch(applicationSlice.actions.hideAlertState({}));
    }
  };

  return (
    <div>
      <StyledToolbar>
        {errorStateIcon}

        <Typography variant="subtitle1" component="div" sx={{ pl: 1 }}>
          {alertState.name}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {showCreateGitHubIssue && (
          <Tooltip title="Create GitHub issue">
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              onClick={() =>
                createGitHubIssue(
                  alertState.name,
                  issueDescription,
                  AlertType.Error
                )
              }
            >
              <GitHubIcon />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={expanded ? "Hide details" : "Show details"}>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Close warning">
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={closeAlertDialog}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </StyledToolbar>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            backgroundColor: colorTheme?.light,
            color: colorTheme.contrastText,
          }}
        >
          <Typography sx={{ pl: 3, pb: 1 }}>
            {alertState.description}
          </Typography>
        </Box>
      </Collapse>
    </div>
  );
};
