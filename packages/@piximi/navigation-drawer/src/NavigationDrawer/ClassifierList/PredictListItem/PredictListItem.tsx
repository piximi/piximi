import {ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import * as React from "react";
import LabelImportantIcon from "@material-ui/icons/LabelImportant";
import {useTranslation} from "react-i18next";
import {Category, Image, Score} from "@piximi/types";
import {createPredictionSet} from "./dataset";
import * as tensorflow from "@tensorflow/tfjs";

type PredictListItemProbs = {
  createImageScore: (images: Array<Image>, scores: Array<Array<Score>>) => void;
  categories: Category[];
  images: Image[];
};

export const PredictListItem = (probs: PredictListItemProbs) => {
  const {createImageScore, categories, images} = probs;

  const {t: translation} = useTranslation();

  const predict = async () => {};

  return (
    <React.Fragment>
      <ListItem button dense disabled onClick={predict}>
        <ListItemIcon>
          <LabelImportantIcon />
        </ListItemIcon>

        <ListItemText primary={translation("Predict")} />
      </ListItem>
    </React.Fragment>
  );
};
