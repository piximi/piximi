import {ListItem, ListItemIcon, ListItemText, Paper} from "@material-ui/core";
import * as React from "react";
import AddIcon from "@material-ui/icons/Add";
import {useDialog} from "@piximi/hooks";
import {ConnectedNewClassifierDialog} from "../../../NewClassifierDialog/ConnectedNewClassifierDialog";

export const NewProjectListItem = () => {
  const {openedDialog, openDialog, closeDialog} = useDialog();

  return (
    <React.Fragment>
      <ListItem button dense onClick={openDialog}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary="New project…" />
      </ListItem>

      <ConnectedNewClassifierDialog
        closeDialog={closeDialog}
        openedDialog={openedDialog}
      />
    </React.Fragment>
  );
};
