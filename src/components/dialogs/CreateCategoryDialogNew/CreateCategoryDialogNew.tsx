import { useDispatch } from "react-redux";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { CategoryDialog } from "../CategoryDialog";

type CreateCategoriesDialogProps = {
  onClose: () => void;
  kind: string;
  open: boolean;
};

export const CreateCategoryDialogNew = ({
  onClose,
  kind,
  open,
}: CreateCategoriesDialogProps) => {
  const dispatch = useDispatch();

  const handleConfirm = (name: string, color: string, kind: string) => {
    dispatch(
      newDataSlice.actions.createCategory({
        name,
        color,
        kind: kind,
        isPermanent: true,
      })
    );
  };

  return (
    <CategoryDialog
      kind={kind}
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      action="Create"
    />
  );
};
