import React, { FormEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sample } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { Category } from "types/Category";
import { replaceDuplicateName } from "image/imageHelper";
import { imageViewerSlice, setAnnotationCategories } from "store/slices";
import { annotationCategoriesSelector } from "store/selectors/annotatorCategoriesSelector";
import { CategoryDialog } from "../CategoryDialog";
import { availableAnnotationColorsSelector } from "store/selectors/availableAnnotationColorsSelector";

type CreateCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const CreateCategoryDialog = ({
  onClose,
  open,
}: CreateCategoryDialogProps) => {
  const dispatch = useDispatch();

  const annotationCategories = useSelector(annotationCategoriesSelector);

  const availableColors = useSelector(availableAnnotationColorsSelector);
  const [color, setColor] = React.useState<string>(sample(availableColors)!);

  const [name, setName] = useState<string>("");

  const onCreate = () => {
    const initialName = name ? name : "Unnamed";
    const categoryNames = annotationCategories.map((category: Category) => {
      return category.name;
    });
    const updatedName = replaceDuplicateName(initialName, categoryNames);

    const category: Category = {
      color: color,
      id: uuidv4().toString(),
      name: updatedName,
      visible: true,
    };

    dispatch(
      setAnnotationCategories({
        categories: [...annotationCategories, category],
      })
    );

    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );

    setName("");

    onClose();

    setColor(sample(availableColors)!);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <CategoryDialog
      onCloseDialog={onClose}
      openDialog={open}
      onSubmit={onSubmit}
      title={"Create category"}
      color={color}
      setColor={setColor}
      name={name}
      setName={setName}
      action={"Create"}
      onConfirm={onCreate}
    />
  );
};
