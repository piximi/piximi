import React, { useEffect } from "react";
import {
  FitClassifierListItem,
  PredictClassifierListItem,
  EvaluateClassifierListItem,
} from "../ClassifierListItems";
import {
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSelector } from "react-redux";
import { fittedSelector } from "store/selectors/fittedSelector";
import { trainingFlagSelector } from "store/selectors/trainingFlagSelector";
import { CategoriesList } from "components/CategoriesList";
import {
  createdCategoriesSelector,
  unknownCategorySelector,
} from "store/selectors";
import { predictedSelector } from "store/selectors/predictedSelector";
import { CategoryType } from "types/Category";

export const ClassifierList = () => {
  const categories = useSelector(createdCategoriesSelector);
  const unknownCategory = useSelector(unknownCategorySelector);

  const predicted = useSelector(predictedSelector);

  const [collapsed, setCollapsed] = React.useState(false);

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
          categories={categories}
          unknownCategory={unknownCategory}
          predicted={predicted}
          categoryType={CategoryType.ClassifierCategory}
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
