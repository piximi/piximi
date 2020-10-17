import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import AddIcon from "@material-ui/icons/Add";
import ListItemText from "@material-ui/core/ListItemText";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import SaveIcon from "@material-ui/icons/Save";
import React from "react";
import List from "@material-ui/core/List";
import { bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import { NewClassifierDialog } from "./NewClassifierDialog";
import { OpenMenu } from "./OpenMenu";
import { SaveMenu } from "./SaveMenu";

export const FileList = () => {
  const [openNewClassifierDialog, setOpenNewClassifierDialog] = React.useState(
    false
  );

  const onOpenNewClassifierDialog = () => {
    setOpenNewClassifierDialog(true);
  };

  const onCloseNewClassifierDialog = () => {
    setOpenNewClassifierDialog(false);
  };

  const openMenu = usePopupState({
    popupId: "open-menu",
    variant: "popover",
  });

  const saveMenu = usePopupState({
    popupId: "save-menu",
    variant: "popover",
  });

  return (
    <React.Fragment>
      <List dense>
        <ListItem button onClick={onOpenNewClassifierDialog}>
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>

          <ListItemText primary="New classifier…" />
        </ListItem>

        <ListItem button {...bindTrigger(openMenu)}>
          <ListItemIcon>
            <FolderOpenIcon />
          </ListItemIcon>

          <ListItemText primary="Open" />
        </ListItem>

        <ListItem button {...bindTrigger(saveMenu)}>
          <ListItemIcon>
            <SaveIcon />
          </ListItemIcon>

          <ListItemText primary="Save" />
        </ListItem>
      </List>

      <NewClassifierDialog
        onClose={onCloseNewClassifierDialog}
        open={openNewClassifierDialog}
      />

      <OpenMenu menu={openMenu} />

      <SaveMenu menu={saveMenu} />
    </React.Fragment>
  );
};
