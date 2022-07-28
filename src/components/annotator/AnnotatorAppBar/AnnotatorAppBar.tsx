import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { LogoIcon } from "components/Logo";
import { AppBarOffset } from "components/styled/AppBarOffset";
import { ExitAnnotatorDialog } from "../AnnotatorDrawer/ExitAnnotatorDialog";
import { useDialog } from "hooks";

export const AnnotatorAppBar = () => {
  const navigate = useNavigate();

  const {
    onClose: onCloseExitAnnotatorDialog,
    onOpen: onOpenExitAnnotatorDialog,
    open: openExitAnnotatorDialog,
  } = useDialog();

  const onReturnToMainProject = () => {
    onCloseExitAnnotatorDialog();
    navigate("/");
  };

  return (
    <>
      <Box>
        <AppBar
          color="default"
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0)",
            // borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            boxShadow: "none",
            position: "absolute",
          }}
        >
          <Toolbar>
            <Tooltip title="Save and return to project" placement="bottom">
              <IconButton
                edge="start"
                onClick={onOpenExitAnnotatorDialog}
                aria-label="Exit Annotator"
                href={""}
              >
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <LogoIcon width={30} height={30} />
            <Typography variant="h5" color={"#02aec5"}>
              Annotator
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>

      <AppBarOffset />

      <ExitAnnotatorDialog
        onReturnToProject={onReturnToMainProject}
        onClose={onCloseExitAnnotatorDialog}
        open={openExitAnnotatorDialog}
      />
    </>
  );
};
