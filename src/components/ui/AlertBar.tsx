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
import { useTheme } from "@mui/material/styles";

import {
  Close as CloseIcon,
  ErrorOutline as ErrorOutlineIcon,
  WarningAmberOutlined as WarningAmberOutlinedIcon,
  InfoOutlined as InfoOutlinedIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  GitHub as GitHubIcon,
} from "@mui/icons-material";

import { applicationSettingsSlice } from "store/applicationSettings";

import { createGitHubIssue } from "utils/logUtils";
import { AlertType } from "utils/enums";
import { AlertState } from "utils/types";

type AlertBarProps = {
  alertState: AlertState;
  setShowAlertBar?: (show: boolean) => void;
};

export const AlertBar = ({
  alertState,
  setShowAlertBar = undefined,
}: AlertBarProps) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [expanded, setExpanded] = React.useState(false);
  const [showCreateGitHubIssue, setShowCreateGitHubIssue] =
    React.useState(false);
  const [colorTheme, setColorTheme] = React.useState<PaletteColor>(
    theme.palette.primary,
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
            alertState.stackTrace,
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
    zIndex: 5000,
    position: "relative",
    width: "100%",
    "@media all": {
      minHeight: "10px",
    },
  }));

  const closeAlertBar = () => {
    if (setShowAlertBar) {
      setShowAlertBar(false);
    } else {
      dispatch(applicationSettingsSlice.actions.hideAlertState());
    }
  };

  return (
    <div style={{ position: "absolute", width: "100%", top: 0, zIndex: 5000 }}>
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
                  AlertType.Error,
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
            {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Close warning">
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            onClick={closeAlertBar}
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
          <Typography sx={{ pl: 3, pb: 1, whiteSpace: "pre-wrap" }}>
            {alertState.description}
          </Typography>
        </Box>
      </Collapse>
    </div>
  );
};
