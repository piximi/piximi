import React, { useMemo, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { Collapse, Divider, IconButton, List, SvgIcon } from "@mui/material";
import { Label as LabelIcon } from "@mui/icons-material";

import { useTranslation } from "hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";

import {
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";

import { imageViewerSlice } from "store/imageViewer";
import { selectAllCategories } from "store/data/selectors";
import { selectActiveAnnotations } from "store/imageViewer/reselectors";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";

import { OldCategory } from "store/data/types";
import { groupBy } from "lodash";
import { DividerHeader, FunctionalDivider } from "components/ui/DividerHeader";

export const PointerSelectionOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const activeAnnotations = useSelector(selectActiveAnnotations);
  const annotationCategories = useSelector(selectAllCategories);
  const [showCategories, setShowCategories] = useState(false);
  const groupedCategories = useMemo(() => {
    const objectCategories = annotationCategories.filter(
      (cat) => cat.kind !== "Image"
    );
    return Object.entries(groupBy(objectCategories, "kind"));
  }, [annotationCategories]);

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
    dispatch(
      imageViewerSlice.actions.setWorkingAnnotation({ annotation: undefined })
    );
  };

  const handleSelectCategory = (categoryId: string) => {
    const annotationIds = activeAnnotations.reduce(
      (ids: string[], annotation) => {
        if (annotation.categoryId === categoryId) {
          ids.push(annotation.id);
        }
        return ids;
      },
      []
    );
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setSelectedAnnotationIds({
          annotationIds: annotationIds,
          workingAnnotationId: annotationIds[0],
        })
      );
      dispatch(
        imageViewerSlice.actions.setWorkingAnnotation({
          annotation: annotationIds[0],
        })
      );
    });
  };

  const handleToggleCategories = () => {
    setShowCategories(!showCategories);
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

        <FunctionalDivider
          headerText={t("Select by Category")}
          actions={
            <IconButton onClick={handleToggleCategories}>
              {showCategories ? (
                <KeyboardArrowDownIcon fontSize="small" />
              ) : (
                <KeyboardArrowRightIcon fontSize="small" />
              )}
            </IconButton>
          }
        />

        <Collapse in={showCategories} sx={{ px: 1 }}>
          {groupedCategories.map(([kind, categories]) => {
            return (
              <React.Fragment key={kind}>
                <DividerHeader
                  key={kind}
                  typographyVariant="body2"
                  textAlign="left"
                >
                  {kind}
                </DividerHeader>
                <List sx={{ pl: 4 }}>
                  {categories.map((category: OldCategory, idx: number) => {
                    return (
                      <CustomListItemButton
                        key={`${kind}-${idx}`}
                        primaryText={category.name}
                        onClick={() => handleSelectCategory(category.id)}
                        icon={
                          <LabelIcon
                            sx={{ color: category.color }}
                            fontSize="small"
                          />
                        }
                        sx={{
                          "& .MuiListItemIcon-root": {
                            minWidth: 25,
                          },
                        }}
                        dense
                        disableGutters
                      />
                    );
                  })}
                </List>
              </React.Fragment>
            );
          })}
        </Collapse>
      </List>
    </>
  );
};
