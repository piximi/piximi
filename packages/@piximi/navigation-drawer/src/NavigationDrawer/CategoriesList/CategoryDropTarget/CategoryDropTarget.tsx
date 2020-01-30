import {Category, Image} from "@piximi/types";
import {useDrop} from "react-dnd";
import * as React from "react";

type CategoryDropTargetProps = {
  category: Category;
  children: React.ReactNode;
  updateImagesCategory: (images: Array<Image>, category: Category) => void;
};

export const CategoryDropTarget = (props: CategoryDropTargetProps) => {
  const {category, children, updateImagesCategory} = props;

  const drop = React.useCallback(
    (droppedItem) => {
      updateImagesCategory(droppedItem.selectedItems, category);
    },
    [category.identifier, updateImagesCategory]
  );

  const spec = {
    accept: "image",
    drop: drop
  };

  const [, dropTarget] = useDrop(spec);

  return <div ref={dropTarget}>{children}</div>;
};
