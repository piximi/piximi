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
  FitSegmenterListItem,
  PredictSegmenterListItem,
  EvaluateSegmenterListItem,
} from "../SegmenterListItems";

import { CategoriesList } from "components/categories/CategoriesList";

import {
  createdAnnotatorCategoriesSelector,
  unknownAnnotationCategorySelector,
} from "store/project";
import {
  fittedSegmentationModelSelector,
  segmentationTrainingFlagSelector,
} from "store/segmenter";

import { CategoryType } from "types";
import { APPLICATION_COLORS } from "colorPalette";

export const SegmenterList = () => {
  const categories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownCategory = useSelector(unknownAnnotationCategorySelector);

  const [collapsed, setCollapsed] = React.useState(false);

  const [disabled, setDisabled] = React.useState<boolean>(true);
  const [helperText, setHelperText] = React.useState<string>(
    "disabled: no trained model"
  );

  const fitted = useSelector(fittedSegmentationModelSelector);
  const training = useSelector(segmentationTrainingFlagSelector);

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
    <List dense sx={{ bgcolor: APPLICATION_COLORS.segmenterList }}>
      <ListItem button dense onClick={onCollapseClick}>
        <ListItemIcon>
          {collapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary="Segmenter" />
      </ListItem>

      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <CategoriesList
          createdCategories={categories}
          unknownCategory={unknownCategory}
          predicted={false}
          categoryType={CategoryType.AnnotationCategory}
          onCategoryClickCallBack={() => {
            return;
          }}
        />

        <Divider />

        <List component="div" dense disablePadding>
          <FitSegmenterListItem />

          <PredictSegmenterListItem
            disabled={disabled}
            helperText={helperText}
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
