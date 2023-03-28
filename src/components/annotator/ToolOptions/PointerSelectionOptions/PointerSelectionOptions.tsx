import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SvgIcon,
} from "@mui/material";

import { useTranslation } from "hooks";

import { Label as LabelIcon } from "@mui/icons-material";

import { CollapsibleList } from "components/common/CollapsibleList";

import { imageViewerSlice } from "store/annotator";
import {
  selectAllAnnotationCategories,
  selectSelectedAnnotations,
  selectStagedAnnotations,
} from "store/data";

import { Category } from "types";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";

export const PointerSelectionOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const stagedAnnotations = useSelector(selectStagedAnnotations);
  const annotationCategories = useSelector(selectAllAnnotationCategories);

  const onSelectAll = () => {
    const allAnnotations = [...selectedAnnotations, ...stagedAnnotations];
    dispatch(
      imageViewerSlice.actions.setSelectedAnnotationIds({
        selectedAnnotationIds: allAnnotations.map((an) => an.id),
        workingAnnotationId: allAnnotations[0].id,
      })
    );
  };

  const onSelectNone = () => {
    dispatch(
      imageViewerSlice.actions.setSelectedAnnotationIds({
        selectedAnnotationIds: [],
        workingAnnotationId: undefined,
      })
    );
  };

  const onSelectCategory = (
    event:
      | React.MouseEvent<HTMLLIElement>
      | React.MouseEvent<HTMLAnchorElement>
      | React.MouseEvent<HTMLDivElement>,
    category: Category
  ) => {
    const allAnnotations = [...selectedAnnotations, ...stagedAnnotations];
    const desiredAnnotations = allAnnotations.filter((annotation) => {
      return annotation.categoryId === category.id;
    });
    dispatch(
      imageViewerSlice.actions.setSelectedAnnotationIds({
        selectedAnnotationIds: desiredAnnotations.map((an) => an.id),
        workingAnnotationId: desiredAnnotations[0].id,
      })
    );
  };

  return (
    <>
      <Divider />

      <List>
        <ListItem button onClick={onSelectAll} dense>
          <ListItemIcon>
            <SvgIcon>
              <InvertSelectionIcon />
            </SvgIcon>
          </ListItemIcon>

          <ListItemText primary={t("Select all")} />
        </ListItem>
        <ListItem button onClick={onSelectNone} dense>
          <ListItemIcon>
            <SvgIcon>
              <InvertSelectionIcon />
            </SvgIcon>
          </ListItemIcon>

          <ListItemText primary={t("Select none")} />
        </ListItem>
      </List>

      <Divider />
      <CollapsibleList closed dense primary={t("Select by Category")}>
        {annotationCategories.map((category: Category, idx: number) => {
          return (
            <ListItem
              button
              id={category.id}
              onClick={(event) => onSelectCategory(event, category)}
              key={idx}
            >
              <ListItemIcon>
                <LabelIcon style={{ color: category.color }} />
              </ListItemIcon>
              <ListItemText primary={category.name} />
            </ListItem>
          );
        })}
      </CollapsibleList>
    </>
  );
};
