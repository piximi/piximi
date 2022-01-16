import React, { FormEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sample } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { Category } from "../../../../types/Category";
import { replaceDuplicateName } from "../../../../image/imageHelper";
import { imageViewerSlice } from "../../../../store/slices";
import { annotatorCategoriesSelector } from "../../../../store/selectors/annotatorCategoriesSelector";
import { CategoryDialog } from "../CategoryDialog";

export const COLORS = [
  "#000000",
  "#004949",
  "#009292",
  "#ff6db6",
  "#ffb6db",
  "#490092",
  "#006ddb",
  "#b66dff",
  "#6db6ff",
  "#b6dbff",
  "#920000",
  "#924900",
  "#db6d00",
  "#24ff24",
  "#ffff6d",
];

type CreateCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const CreateCategoryDialog = ({
  onClose,
  open,
}: CreateCategoryDialogProps) => {
  const dispatch = useDispatch();

  const categories = useSelector(annotatorCategoriesSelector);

  const [color, setColor] = React.useState<string>(sample(COLORS)!);

  const [name, setName] = useState<string>("");

  const onCreate = () => {
    const initialName = name ? name : "Unnamed";
    const categoryNames = categories.map((category: Category) => {
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
      imageViewerSlice.actions.setCategories({
        categories: [...categories, category],
      })
    );

    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );

    setName("");

    onClose();

    setColor(sample(COLORS)!);
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
