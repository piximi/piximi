import React, { useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import SettingsIcon from "@mui/icons-material/Settings";
import { SettingsDialog } from "../SettingsDialog";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";
import { useStyles } from "./SettingsButton.css";

export const SettingsButton = () => {
  const classes = useStyles();

  const [openSettingsDialog, setOpenSettingsDialog] = useState<boolean>(false);

  const onSettingsClick = () => {
    setOpenSettingsDialog(true);
  };

  const onSettingsDialogClose = () => {
    setOpenSettingsDialog(false);
  };

  const t = useTranslation();

  return (
    <>
      <Tooltip title={t("Settings")}>
        <Button
          className={classes.button}
          startIcon={<SettingsIcon />}
          onClick={onSettingsClick}
        >
          {t("Settings")}
        </Button>
      </Tooltip>
      <SettingsDialog
        open={openSettingsDialog}
        onClose={onSettingsDialogClose}
      />
    </>
  );
};
