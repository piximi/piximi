import {
  IconButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useDialog } from "../../hooks";
import { useDispatch, useSelector } from "react-redux";
import { EvaluateClassifierDialog } from "components/EvaluateClassifierDialog/EvaluateClassifierDialog";
import { useEffect } from "react";
import { Category } from "types/Category";
import { createdCategoriesSelector } from "store/selectors";
import { DisabledClassifierListItem } from "./DisabledClassifierListItem";
import { evaluationResultSelector } from "store/selectors/evaluationResultSelector";
import { classifierSlice } from "store/slices";

type EvaluateClassifierListItemProbs = {
  disabled: boolean;
  helperText: string;
};

export const EvaluateClassifierListItem = (props: EvaluateClassifierListItemProbs) => {
  const { onClose, onOpen, open } = useDialog();
  const dispatch = useDispatch();

  const categories: Category[] = useSelector(createdCategoriesSelector);
  const evaluationResult = useSelector(evaluationResultSelector);

  const onEvaluateClick = async () => {
    dispatch(classifierSlice.actions.evaluate({}));
  };

  useEffect(() => {
    if (evaluationResult.accuracy !== -1) {
      onOpen();
    }
  }, [evaluationResult]);

  return (
    <>
      <DisabledClassifierListItem {...props}>
        <ListItemIcon>
          <AssessmentIcon />
        </ListItemIcon>
        <ListItemText primary="Evaluate" />
        <IconButton 
          onClick={onEvaluateClick}
          edge="end"
          disabled={props.disabled}
          >
          <KeyboardArrowRightIcon />
        </IconButton>
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
      />
    </>
  );
};
