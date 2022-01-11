import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Category } from "../../../../types/Category";
import { imageViewerSlice } from "../../../../store/slices";
import { selectedCategorySelector } from "../../../../store/selectors";
import { annotatorCategoriesSelector } from "../../../../store/selectors/annotatorCategoriesSelector";
import { CategoryDialog } from "../CategoryDialog";

type EditCategoryDialogProps = {
  onCloseDialog: () => void;
  openDialog: boolean;
};

export const EditCategoryDialog = ({
  onCloseDialog,
  openDialog,
}: EditCategoryDialogProps) => {
  const dispatch = useDispatch();

  const category = useSelector(selectedCategorySelector);

  const [color, setColor] = useState<string>(category.color);

  useEffect(() => {
    setName(category.name);
    setColor(category.color);
  }, [category]);

  const [name, setName] = useState<string>(category.name);

  const categories = useSelector(annotatorCategoriesSelector);

  const onEdit = () => {
    const updatedCategories = categories?.map((v: Category) => {
      if (v.id === category.id) {
        return {
          ...category,
          color: color,
          name: name,
        };
      } else {
        return v;
      }
    });
    dispatch(
      imageViewerSlice.actions.setCategories({ categories: updatedCategories })
    );

    onCloseDialog();
  };

  return (
    <CategoryDialog
      onCloseDialog={onCloseDialog}
      openDialog={openDialog}
      title={"Edit category"}
      color={color}
      setColor={setColor}
      name={name}
      setName={setName}
      action={"Update"}
      onConfirm={onEdit}
    />
  );
};
