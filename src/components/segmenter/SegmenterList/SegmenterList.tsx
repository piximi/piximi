import React, { useEffect } from "react";
import {
  FitSegmenterListItem,
  PredictSegmenterListItem,
  EvaluateSegmenterListItem,
} from "../SegmenterListItems";
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
import { createdAnnotatorCategoriesSelector } from "store/selectors/createdAnnotatorCategoriesSelector";
import { unknownAnnotationCategorySelector } from "store/selectors";
import { CategoriesList } from "components/CategoriesList";
import { CategoryType } from "types/Category";

export const SegmenterList = () => {
  const categories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownCategory = useSelector(unknownAnnotationCategorySelector);

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

        <ListItemText primary="Segmenter" />
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <CategoriesList
          categories={categories}
          unknownCategory={unknownCategory}
          predicted={false}
          categoryType={CategoryType.AnnotationCategory}
        />

        <Divider />

        <List component="div" dense disablePadding>
          <FitSegmenterListItem />

          <PredictSegmenterListItem
            disabled={true}
            helperText={"Not yet implemented."}
          />

          <EvaluateSegmenterListItem
            disabled={true}
            helperText={"Not yet implemented."}
          />
        </List>
      </Collapse>
    </List>
  );
};
