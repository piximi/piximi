import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import {
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

import {
  FitClassifierListItem,
  PredictClassifierListItem,
  EvaluateClassifierListItem,
} from "../ClassifierListItems";

import { CategoriesList } from "components/CategoriesList";

import {
  createdCategoriesSelector,
  fittedSelector,
  predictedSelector,
  trainingFlagSelector,
  unknownCategorySelector,
} from "store/selectors";

import { Category, CategoryType } from "types";

export const ClassifierList = () => {
  const categories = useSelector(createdCategoriesSelector);
  const unknownCategory = useSelector(unknownCategorySelector);

  const predicted = useSelector(predictedSelector);

  const [collapsed, setCollapsed] = React.useState(true);

  const [disabled, setDisabled] = React.useState<boolean>(true);
  const [helperText, setHelperText] = React.useState<string>(
    "disabled: no trained model"
  );

  const fitted = useSelector(fittedSelector);
  const training = useSelector(trainingFlagSelector);

  useEffect(() => {
    if (training) {
      setDisabled(true);
      setHelperText("disabled during training");
    }
  }, [training]);

  useEffect(() => {
    if (fitted) {
      setDisabled(false);
    } else {
      setDisabled(true);
      setHelperText("disabled: no trained model");
    }
  }, [fitted]);

  const onCollapseClick = () => {
    setCollapsed(!collapsed);
  };

  const onCategoryClickCallBack = (category: Category) => {};

  return (
    <List dense>
      <ListItem button dense onClick={onCollapseClick}>
        <ListItemIcon>
          {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary="Classifier" />
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <CategoriesList
          createdCategories={categories}
          unknownCategory={unknownCategory}
          predicted={predicted}
          categoryType={CategoryType.ClassifierCategory}
          onCategoryClickCallBack={onCategoryClickCallBack}
        />

        <Divider />

        <List component="div" dense disablePadding>
          <FitClassifierListItem />

          <PredictClassifierListItem
            disabled={disabled}
            helperText={helperText}
          />

          <EvaluateClassifierListItem
            disabled={disabled}
            helperText={helperText}
          />
        </List>
      </Collapse>
    </List>
  );
};
