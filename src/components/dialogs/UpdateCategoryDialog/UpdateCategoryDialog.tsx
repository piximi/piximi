import { useDispatch } from "react-redux";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { CategoryDialog } from "../CategoryDialog";
import { NewCategory } from "types/Category";

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
      newDataSlice.actions.updateCategory({
        updates: {
          id: category.id,
          name,
          color,
          kind: kind,
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
