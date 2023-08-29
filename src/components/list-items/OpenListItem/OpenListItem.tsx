import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { OpenMenu } from "../../file-io/menus/OpenMenu";
import { useMenu } from "hooks";

export const OpenListItem = () => {
  const { anchorEl, onClose, open, onOpen } = useMenu();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <FolderOpenIcon />
        </ListItemIcon>

        <ListItemText primary="Open" />
      </ListItem>

      <OpenMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
