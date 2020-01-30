import * as React from "react";

import {useDialog} from "@piximi/hooks";
import {ConnectedOpenExampleClassifierDialog} from "@piximi/open-example-classifier-dialog";
import {ListItemText, MenuItem} from "@material-ui/core";

type OpenExampleProjectMenuItemProps = {
  closeMenu: () => void;
};

export const OpenExampleProjectMenuItem = (
  props: OpenExampleProjectMenuItemProps
) => {
  const {closeMenu} = props;

  const {openedDialog, openDialog, closeDialog} = useDialog();

  const onClick = () => {
    openDialog();
  };

  return (
    <React.Fragment>
      <MenuItem onClick={onClick}>
        <ListItemText primary="Open example project" />
      </MenuItem>

      <ConnectedOpenExampleClassifierDialog
        onClose={closeDialog}
        open={openedDialog}
        closeMenu={closeMenu}
      />
    </React.Fragment>
  );
};
