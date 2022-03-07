import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useDialog } from "../../hooks";
import { useDispatch, useSelector } from "react-redux";
import { EvaluateClassifierDialog } from "components/EvaluateClassifierDialog/EvaluateClassifierDialog";
import { Category } from "types/Category";
import { createdCategoriesSelector } from "store/selectors";
import { DisabledClassifierListItem } from "./DisabledClassifierListItem";
import { evaluationResultSelector } from "store/selectors/evaluationResultSelector";
import { classifierSlice } from "store/slices";
import { evaluationFlagSelector } from "store/selectors/evaluationFlagSelector";
import React, { useEffect } from "react";
import { useTranslation } from "hooks/useTranslation";
import { alertStateSelector } from "store/selectors/alertStateSelector";
import { AlertType } from "types/AlertStateType";

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
    if (isEvaluating) {
      return;
    }
    dispatch(classifierSlice.actions.evaluate({}));
  };

  useEffect(() => {
    if (
      isEvaluating &&
      !evaluationFlag &&
      alertState.alertType === AlertType.None
    ) {
      onOpen();
    }
    setIsEvaluating(evaluationFlag);
  }, [alertState.alertType, evaluationFlag, isEvaluating, onOpen]);

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
