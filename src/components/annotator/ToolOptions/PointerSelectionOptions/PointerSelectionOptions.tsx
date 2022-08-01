import React from "react";
import { useDispatch, useSelector } from "react-redux";

import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import SvgIcon from "@mui/material/SvgIcon";
import ListItemText from "@mui/material/ListItemText";

import LabelIcon from "@mui/icons-material/Label";

import { useTranslation } from "hooks/useTranslation";

import { InformationBox } from "../InformationBox";

import { CollapsibleList } from "components/common/CollapsibleList";

import { annotationCategoriesSelector } from "store/selectors";
import { selectedAnnotationsSelector } from "store/selectors/selectedAnnotationsSelector";
import { unselectedAnnotationsSelector } from "store/selectors/unselectedAnnotationsSelector";

import { imageViewerSlice } from "store/slices";

import { Category } from "types/Category";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";

export const PointerSelectionOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);
  const unselectedAnnotations = useSelector(unselectedAnnotationsSelector);
  const annotationCategories = useSelector(annotationCategoriesSelector);

  const onSelectAll = () => {
    const allAnnotations = [...selectedAnnotations, ...unselectedAnnotations];
    dispatch(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: allAnnotations,
        selectedAnnotation: allAnnotations[0],
      })
    );
  };

  const onSelectNone = () => {
    dispatch(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [],
        selectedAnnotation: undefined,
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
    const allAnnotations = [...selectedAnnotations, ...unselectedAnnotations];
    const desiredAnnotations = allAnnotations.filter((annotation) => {
      return annotation.categoryId === category.id;
    });
    dispatch(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: desiredAnnotations,
        selectedAnnotation: desiredAnnotations[0],
      })
    );
  };

  return (
    <>
      <InformationBox description="…" name={t("Select annotations")} />

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
        {annotationCategories.map((category: Category) => {
          return (
            <ListItem
              button
              id={category.id}
              onClick={(event) => onSelectCategory(event, category)}
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
