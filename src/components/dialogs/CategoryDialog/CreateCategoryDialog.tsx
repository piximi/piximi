import { useDispatch } from "react-redux";

import { CategoryDialog } from "./CategoryDialog";

import { dataSlice } from "store/data/dataSlice";

type CreateCategoriesDialogProps = {
  onClose: () => void;
  kind: string;
  open: boolean;
  changesPermanent?: boolean;
};

export const CreateCategoryDialog = ({
  onClose,
  kind,
  open,
  changesPermanent,
}: CreateCategoriesDialogProps) => {
  const dispatch = useDispatch();

  const handleConfirm = (name: string, color: string, kind: string) => {
    dispatch(
      dataSlice.actions.createCategory({
        name,
        color,
        kind: kind,
        isPermanent: changesPermanent,
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
