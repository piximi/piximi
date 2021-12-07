import { useTranslation } from "../../../../hooks/useTranslation";
import { Dialog, DialogTitle } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import DescriptionIcon from "@mui/icons-material/Description";
import ListItemText from "@mui/material/ListItemText";
import React from "react";

type HelpDialogProps = {
  onClose: () => void;
  open: boolean;
  onOpenOpenImagesHelpDialog: () => void;
  onOpenMakeAnnotationsHelpDialog: () => void;
  onOpenManipulatingCanvasHelpDialog: () => void;
  onOpenChangingAnnotationsHelpDialog: () => void;
  onOpenSavingProjectHelpDialog: () => void;
};

export const HelpDialog = ({
  onClose,
  open,
  onOpenOpenImagesHelpDialog,
  onOpenMakeAnnotationsHelpDialog,
  onOpenManipulatingCanvasHelpDialog,
  onOpenChangingAnnotationsHelpDialog,
  onOpenSavingProjectHelpDialog,
}: HelpDialogProps) => {
  const t = useTranslation();

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <AppBar position="relative">
        <Toolbar>
          <Typography style={{ flexGrow: 1 }} variant="h6">
            <DialogTitle>{t("Help")}</DialogTitle>
          </Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <List>
        <ListItem button onClick={onOpenOpenImagesHelpDialog}>
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>

          <ListItemText primary={t("Opening images")} />
        </ListItem>

        <ListItem button onClick={onOpenManipulatingCanvasHelpDialog}>
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>

          <ListItemText primary={t("Manipulating the canvas")} />
        </ListItem>

        <ListItem button onClick={onOpenMakeAnnotationsHelpDialog}>
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>

          <ListItemText primary={t("Making new annotations")} />
        </ListItem>

        <ListItem button onClick={onOpenChangingAnnotationsHelpDialog}>
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>

          <ListItemText primary={t("Changing existing annotations")} />
        </ListItem>

        <ListItem button onClick={onOpenSavingProjectHelpDialog}>
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>

          <ListItemText
            primary={t("Saving project and exporting annotations")}
          />
        </ListItem>
      </List>
    </Dialog>
  );
};
