import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { useMenu } from "hooks";
import { OpenMenu } from "../OpenMenu/OpenMenu";

export const OpenListItem = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <FolderOpenIcon />
        </ListItemIcon>

        <ListItemText primary="Open" />
      </ListItem>

      <OpenMenu anchorEl={anchorEl} onCloseMenu={onClose} open={open} />
    </>
  );
};
