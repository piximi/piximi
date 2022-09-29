import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { useDialogHotkey } from "hooks";
import { DeleteAllCategoriesDialog } from "../DeleteAllCategoriesDialog";

import { CategoryType, HotkeyView } from "types";

type DeleteAllCategoriesItemProps = {
  categoryType: CategoryType;
};

export const DeleteAllCategoriesItem = ({
  categoryType,
}: DeleteAllCategoriesItemProps) => {
  const { onClose, onOpen, open } = useDialogHotkey(
    HotkeyView.DeleteAllCategoriesDialog
  );

  return (
    <>
      <ListItem button onClick={onOpen}>
        <ListItemIcon>
          <DeleteIcon color="disabled" />
        </ListItemIcon>

        <ListItemText primary={"Delete all categories"} />
      </ListItem>

      <DeleteAllCategoriesDialog
        categoryType={categoryType}
        onClose={onClose}
        open={open}
      />
    </>
  );
};
