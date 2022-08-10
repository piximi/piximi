import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import SaveIcon from "@mui/icons-material/Save";
import { SaveMenu } from "../SaveMenu/SaveMenu";
import { useTranslation } from "hooks/useTranslation";

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
