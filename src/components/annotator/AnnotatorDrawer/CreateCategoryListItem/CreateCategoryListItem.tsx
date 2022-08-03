import React from "react";

import { ListItem, ListItemIcon, ListItemText } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import { useDialog, useTranslation } from "hooks";

import { CreateCategoryDialog } from "../../CategoryDialog/CreateCategoryDialog";

export const CreateCategoryListItem = () => {
  const { onClose, onOpen, open } = useDialog();

  const t = useTranslation();

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>

        <ListItemText primary={t("Create category")} />
      </ListItem>

      <CreateCategoryDialog onClose={onClose} open={open} />
    </>
  );
};
