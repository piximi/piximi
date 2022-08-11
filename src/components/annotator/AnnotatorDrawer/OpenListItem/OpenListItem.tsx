import PopupState, { bindTrigger } from "material-ui-popup-state";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

import { OpenMenu } from "../OpenMenu/OpenMenu";

export const OpenListItem = () => {
  return (
    <PopupState variant="popover">
      {(popupState) => (
        <>
          <ListItem button {...bindTrigger(popupState)}>
            <ListItemIcon>
              <FolderOpenIcon />
            </ListItemIcon>

            <ListItemText primary="Open" />
          </ListItem>

          <OpenMenu popupState={popupState} />
        </>
      )}
    </PopupState>
  );
};
