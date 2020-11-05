import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import React from "react";
import { useMenu } from "../../../../../../hooks";
import { SaveMenu } from "../SaveMenu";

export const SaveListItem = () => {
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

        <ListItemText primary="Save" />
      </ListItem>

      <SaveMenu
        anchorEl={anchorElCategoryMenu}
        onClose={onCloseCategoryMenu}
        onOpen={onOpenCategoryMenu}
        open={openCategoryMenu}
      />
    </React.Fragment>
  );
};
