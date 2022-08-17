import { ListItem, ListItemIcon, ListItemText } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { useDialog } from "hooks";
import { DeleteAllCategoriesDialog } from "../DeleteAllCategoriesDialog";

import { CategoryType } from "types";

type DeleteAllCategoriesItemProps = {
  categoryType: CategoryType;
};

export const DeleteAllCategoriesItem = ({
  categoryType,
}: DeleteAllCategoriesItemProps) => {
  const { onClose, onOpen, open } = useDialog();

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
