import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, List, SvgIcon } from "@mui/material";
import { Label as LabelIcon } from "@mui/icons-material";

import { useTranslation } from "hooks";

import { imageViewerSlice } from "store/imageViewer";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";
import { CustomListItemButton } from "components/CustomListItemButton";
import { CollapsibleListItem } from "components/CollapsibleListItem";
import { selectAllCategories } from "store/data/selectors";
import { OldCategory } from "store/data/types";
import { selectActiveAnnotations } from "store/imageViewer/reselectors";

export const PointerSelectionOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const activeAnnotations = useSelector(selectActiveAnnotations);
  const annotationCategories = useSelector(selectAllCategories);

  const handleSelectAll = () => {
    dispatch(imageViewerSlice.actions.setAllSelectedAnnotationIds({}));
  };

  const handleDeselectAll = () => {
    dispatch(
      imageViewerSlice.actions.setSelectedAnnotationIds({
        annotationIds: [],
        workingAnnotationId: undefined,
      })
    );
  };

  const handleSelectCategory = (categoryId: string) => {
    const desiredAnnotationIds = activeAnnotations.reduce(
      (ids: string[], annotation) => {
        if (annotation.categoryId === categoryId) {
          ids.push(annotation.id);
        }
        return ids;
      },
      []
    );
    dispatch(
      imageViewerSlice.actions.setSelectedAnnotationIds({
        annotationIds: desiredAnnotationIds,
        workingAnnotationId: desiredAnnotationIds[0],
      })
    );
  };

  return (
    <>
      <Divider />

      <List>
        <CustomListItemButton
          primaryText={t("Select All")}
          onClick={handleSelectAll}
          icon={
            <SvgIcon>
              <InvertSelectionIcon />
            </SvgIcon>
          }
          dense
        />

        <CustomListItemButton
          primaryText={t("Deselect All")}
          onClick={handleDeselectAll}
          icon={
            <SvgIcon>
              <InvertSelectionIcon />
            </SvgIcon>
          }
          dense
        />

        <Divider />

        <CollapsibleListItem
          beginCollapsed
          primaryText={t("Select by Category")}
          carotPosition="start"
          dense
        >
          <List>
            {annotationCategories.map((category: OldCategory, idx: number) => {
              return (
                <CustomListItemButton
                  key={idx}
                  primaryText={category.name}
                  onClick={() => handleSelectCategory(category.id)}
                  icon={<LabelIcon style={{ color: category.color }} />}
                  dense
                  disableGutters
                />
              );
            })}
          </List>
        </CollapsibleListItem>
      </List>
    </>
  );
};
