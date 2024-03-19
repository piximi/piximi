import React, { useState } from "react";
import { IconButton, List } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ImageViewerCategoryItem } from "components/list-items/CategoryItem/ImageViewerCategoryItem";
import { CollapsibleListItem } from "components/list-items/CollapsibleListItem";
import { useDispatch, useSelector } from "react-redux";
import { imageViewerSlice } from "store/slices/imageViewer";
import { selectImageViewerActiveKindsWithFullCat } from "store/slices/newData/selectors/reselectors";
import { KindWithCategories } from "types/Category";
import { selectFilteredImageViewerCategoryIds } from "store/slices/imageViewer/selectors/selectFilteredAnnotationCategoryIds";

export const ImageViewerCategoryList = () => {
  const dispatch = useDispatch();
  const kinds = useSelector(selectImageViewerActiveKindsWithFullCat);
  const filteredCategoryIds = useSelector(selectFilteredImageViewerCategoryIds);
  // NOTE: keep for quick checking if kind is hidden
  const [filteredKinds, setFilteredKinds] = useState<Array<string>>([]);

  const isKindFiltered = (kind: KindWithCategories) => {
    //HACK: refactor -- O(n*m)
    return kind.categories.every((cat) => {
      return filteredCategoryIds.includes(cat.id);
    });
  };

  const handleToggleKindVisibility = (
    event: React.MouseEvent,
    kind: KindWithCategories
  ) => {
    event.stopPropagation();
    if (filteredKinds.includes(kind.id)) {
      setFilteredKinds(
        filteredKinds.filter((hiddenKind) => hiddenKind !== kind.id)
      );

      dispatch(
        imageViewerSlice.actions.removeFilters({
          categoryIds: kind.categories.map((category) => category.id),
        })
      );
    } else {
      setFilteredKinds([...filteredKinds, kind.id]);
      dispatch(
        imageViewerSlice.actions.addFilters({
          categoryIds: kind.categories.map((category) => category.id),
        })
      );
    }
  };

  return (
    <List dense>
      {kinds.map((kind) => {
        return (
          <CollapsibleListItem
            primaryText={kind.id}
            key={kind.id}
            secondary={
              <IconButton
                onClick={(event) => handleToggleKindVisibility(event, kind)}
              >
                {isKindFiltered(kind) ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            }
          >
            {kind.categories.map((category) => {
              return (
                <ImageViewerCategoryItem
                  category={category}
                  kind={kind.id}
                  key={category.id}
                  handleOpenCategoryMenu={() => {}}
                />
              );
            })}
          </CollapsibleListItem>
        );
      })}
    </List>
  );
};
