import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AddIcon from "@mui/icons-material/Add";
import React from "react";
import { CreateCategoryDialog } from "../CreateCategoryDialog";
import { useDialog } from "../../../../../annotator/hooks";
import { useTranslation } from "../../../../../annotator/hooks/useTranslation";

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
