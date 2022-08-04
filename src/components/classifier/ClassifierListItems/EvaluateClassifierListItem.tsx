import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import { Assessment as AssessmentIcon } from "@mui/icons-material";

import { useDialog, useTranslation } from "hooks";

import { DisabledClassifierListItem } from "./DisabledClassifierListItem";

import { EvaluateClassifierDialog } from "components/classifier/EvaluateClassifierDialog/EvaluateClassifierDialog";

import {
  alertStateSelector,
  createdCategoriesSelector,
  evaluationFlagSelector,
  evaluationResultSelector,
} from "store/selectors";

import { classifierSlice } from "store/slices";

import { Category } from "types";

type EvaluateClassifierListItemProps = {
  disabled: boolean;
  helperText: string;
};

export const EvaluateClassifierListItem = (
  props: EvaluateClassifierListItemProps
) => {
  const { onClose, onOpen, open } = useDialog();
  const dispatch = useDispatch();
  const t = useTranslation();

  const categories: Category[] = useSelector(createdCategoriesSelector);
  const evaluationResult = useSelector(evaluationResultSelector);
  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);
  const evaluationFlag = useSelector(evaluationFlagSelector);
  const alertState = useSelector(alertStateSelector);

  const onEvaluate = async () => {
    dispatch(classifierSlice.actions.evaluate({}));
  };

  useEffect(() => {
    if (isEvaluating && !evaluationFlag && !alertState.visible) {
      onOpen();
    }
    setIsEvaluating(evaluationFlag);
  }, [alertState.visible, evaluationFlag, isEvaluating, onOpen]);

  return (
    <>
      <DisabledClassifierListItem {...props}>
        <ListItem button onClick={onEvaluate} disablePadding>
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary={t("Evaluate")} />
        </ListItem>

        {isEvaluating && <CircularProgress disableShrink size={20} />}
      </DisabledClassifierListItem>

      <EvaluateClassifierDialog
        openedDialog={open}
        closeDialog={onClose}
        confusionMatrix={evaluationResult.confusionMatrix}
        classNames={categories.map((c: Category) => c.name)}
        accuracy={evaluationResult.accuracy}
        crossEntropy={evaluationResult.crossEntropy}
        precision={evaluationResult.precision}
        recall={evaluationResult.recall}
        f1Score={evaluationResult.f1Score}
      />
    </>
  );
};
