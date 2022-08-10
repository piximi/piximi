import PopupState, { bindTrigger } from "material-ui-popup-state";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";

import { useTranslation } from "hooks";

import { SaveMenu } from "../SaveMenu/SaveMenu";

export const SaveListItem = () => {
  const t = useTranslation();

  return (
    <>
      <PopupState variant="popover">
        {(popupState) => (
          <>
            <ListItem button {...bindTrigger(popupState)}>
              <ListItemIcon>
                <SaveIcon />
              </ListItemIcon>

              <ListItemText primary={t("Save")} />
            </ListItem>
            <SaveMenu popupState={popupState} />
          </>
        )}
      </PopupState>
    </>
  );
};
