import { useDispatch } from "react-redux";

import { CategoryDialog } from "./CategoryDialog";

import { dataSlice } from "store/data/dataSlice";

import { Category } from "store/data/types";

type UpdateCategoriesDialogProps = {
  onClose: () => void;
  category: Category;
  kind: string;
  open: boolean;
};

export const UpdateCategoryDialog = ({
  onClose,
  category,
  kind,
  open,
}: UpdateCategoriesDialogProps) => {
  const dispatch = useDispatch();

  const handleConfirm = (name: string, color: string, kind: string) => {
    dispatch(
      dataSlice.actions.updateCategory({
        updates: {
          id: category.id,
          changes: {
            name,
            color,
          },
        },
      })
    );
  };

  return (
    <CategoryDialog
      kind={kind}
      open={open}
      initColor={category.color}
      initName={category.name}
      onClose={onClose}
      onConfirm={handleConfirm}
      action="Update"
    />
  );
};
