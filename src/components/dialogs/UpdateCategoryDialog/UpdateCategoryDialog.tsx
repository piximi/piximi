import { useDispatch } from "react-redux";
import { dataSlice } from "store/data/dataSlice";
import { CategoryDialog } from "../CategoryDialog";
import { NewCategory } from "store/data/types";

type UpdateCategoriesDialogProps = {
  onClose: () => void;
  category: NewCategory;
  kind: string;
  open: boolean;
};

export const UpdateCategoryDialogNew = ({
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
        isPermanent: true,
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
