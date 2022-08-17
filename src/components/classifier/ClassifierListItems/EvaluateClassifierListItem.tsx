import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CircularProgress,
  Grid,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";

import { useDialog, useTranslation } from "hooks";

import { EvaluateClassifierDialog } from "../EvaluateClassifierDialog/EvaluateClassifierDialog";
import { DisabledListItemButton } from "components/common/DisabledListItemButton/DisabledListItemButton";

import { alertStateSelector } from "store/application";
import {
  classifierEvaluationResultSelector,
  classifierEvaluationFlagSelector,
  classifierSlice,
} from "store/classifier";
import { createdCategoriesSelector } from "store/project";

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
  const evaluationResult = useSelector(classifierEvaluationResultSelector);
  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);
  const evaluationFlag = useSelector(classifierEvaluationFlagSelector);
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
    <Grid item xs={4}>
      <DisabledListItemButton {...props} onClick={onEvaluate}>
        <Stack sx={{ alignItems: "center" }}>
          <ListItemIcon sx={{ justifyContent: "center" }}>
            {isEvaluating ? (
              <CircularProgress disableShrink size={24} />
            ) : (
              <AssessmentIcon />
            )}
          </ListItemIcon>
          <ListItemText primary={t("Evaluate")} />
        </Stack>
      </DisabledListItemButton>

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
    </Grid>
  );
};
