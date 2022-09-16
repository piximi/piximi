import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";

import { useMenu, useTranslation } from "hooks";

import { SaveMenu } from "../SaveMenu/SaveMenu";

export const SaveListItem = () => {
  const t = useTranslation();

  const { anchorEl, onClose, onOpen, open } = useMenu();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <SaveIcon />
        </ListItemIcon>

        <ListItemText primary={t("Save")} />
      </ListItem>
      <SaveMenu anchorEl={anchorEl} onClose={onClose} open={open} />
    </>
  );
};
