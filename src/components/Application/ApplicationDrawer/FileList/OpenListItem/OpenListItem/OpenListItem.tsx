import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import React from "react";
import { OpenMenu } from "../OpenMenu";
import { useMenu } from "../../../../../../hooks";

export const OpenListItem = () => {
  const {
    anchorEl: anchorElCategoryMenu,
    onClose: onCloseCategoryMenu,
    onOpen: onOpenCategoryMenu,
    open: openCategoryMenu,
  } = useMenu();

  return (
    <React.Fragment>
      <ListItem button onClick={onOpenCategoryMenu}>
        <ListItemIcon>
          <FolderOpenIcon />
        </ListItemIcon>

        <ListItemText primary="Open" />
      </ListItem>

      <OpenMenu
        anchorEl={anchorElCategoryMenu}
        onClose={onCloseCategoryMenu}
        onOpen={onOpenCategoryMenu}
        open={openCategoryMenu}
      />
    </React.Fragment>
  );
};
