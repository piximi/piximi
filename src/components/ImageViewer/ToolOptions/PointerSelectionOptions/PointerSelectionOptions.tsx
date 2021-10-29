import Divider from "@mui/material/Divider";
import React from "react";
import { InformationBox } from "../InformationBox";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import SvgIcon from "@mui/material/SvgIcon";
import { ReactComponent as InvertSelectionIcon } from "../../../../icons/InvertAnnotation.svg";
import ListItemText from "@mui/material/ListItemText";
import { applicationSlice } from "../../../../annotator/store";
import { useDispatch, useSelector } from "react-redux";
import { selectedAnnotationsSelector } from "../../../../annotator/store/selectors/selectedAnnotationsSelector";
import { unselectedAnnotationsSelector } from "../../../../annotator/store/selectors/unselectedAnnotationsSelector";
import { CategoryType } from "../../../../annotator/types/CategoryType";
import { CollapsibleList } from "../../CategoriesList/CollapsibleList";
import { categoriesSelector } from "../../../../annotator/store/selectors";
import LabelIcon from "@mui/icons-material/Label";

export const PointerSelectionOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);
  const unselectedAnnotations = useSelector(unselectedAnnotationsSelector);
  const categories = useSelector(categoriesSelector);

  const onSelectAll = () => {
    const allAnnotations = [...selectedAnnotations, ...unselectedAnnotations];
    dispatch(
      applicationSlice.actions.setSelectedAnnotations({
        selectedAnnotations: allAnnotations,
        selectedAnnotation: allAnnotations[0],
      })
    );
  };

  const onSelectNone = () => {
    dispatch(
      applicationSlice.actions.setSelectedAnnotations({
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
    category: CategoryType
  ) => {
    const allAnnotations = [...selectedAnnotations, ...unselectedAnnotations];
    const desiredAnnotations = allAnnotations.filter((annotation) => {
      return annotation.categoryId === category.id;
    });
    dispatch(
      applicationSlice.actions.setSelectedAnnotations({
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
      <CollapsibleList closed dense primary={t("Select Category")}>
        {categories.map((category: CategoryType) => {
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
