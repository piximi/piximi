import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import { StyledSelect } from "components/inputs/StyledSelect";

import type { Category } from "store/dataV2/types";
import { generateCategory } from "store/dataV2/utils";
import { CATEGORY_COLORS, IMAGE_CLASSIFIER_ID } from "store/dataV2/constants";
import type { ModelClassMap } from "store/types";
import { dataSliceV2 } from "store/dataV2";
import { selectAvaliableCategoryColors } from "@ProjectViewer/state/reselectors";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import { getRandomInt } from "utils/dataUtils";
import { isObjectEmpty } from "utils/objectUtils";

export const ClassMapDialog = ({
  open,
  modelClasses,
  projectCategories,
  onConfirm,
  onDismiss,
}: {
  open: boolean;
  modelClasses: string[];
  projectCategories: Category[];
  onConfirm: (catMap: ModelClassMap) => void;
  onDismiss: () => void;
}) => {
  const dispatch = useDispatch();
  const [catMap, setCatMap] = useState<ModelClassMap>({});
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [shouldCreateCategories, setShouldCreateCategories] = useState<boolean>(
    projectCategories.length === 0,
  );
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const availableCategoryColors = useSelector(selectAvaliableCategoryColors);

  const handleConfirmation = () => {
    if (shouldCreateCategories) {
      const newCategories: Category[] = [];
      const confirmedCatMap: ModelClassMap = {};
      modelClasses.forEach((className, idx) => {
        let color = availableCategoryColors.pop();
        if (!color) {
          const choices = Object.values(CATEGORY_COLORS);
          color = choices[getRandomInt(0, choices.length)] as string;
        }
        let cat: Category;
        if (modelTarget.id === IMAGE_CLASSIFIER_ID) {
          cat = generateCategory(className, color, { type: "image" });
        } else {
          cat = generateCategory(className, color, {
            type: "annotation",
            kindId: modelTarget.id,
          });
        }
        newCategories.push(cat);
        confirmedCatMap[idx] = cat.id;
      });
      dispatch(dataSliceV2.actions.batchAddCategory(newCategories));
      onConfirm(confirmedCatMap);
    } else {
      onConfirm(catMap);
    }
  };

  const handleSelectChange = (
    event: SelectChangeEvent<unknown>,
    modelClassIndex: number,
  ) => {
    const catId = event.target.value as string;
    setCatMap((catMap) => ({ ...catMap, [modelClassIndex]: catId }));
    setAssignedClasses((classes) => {
      classes.push(catId);
      return classes;
    });
  };

  useEffect(() => {
    setCatMap(
      modelClasses.reduce((map: ModelClassMap, className, idx) => {
        map[idx] = "";
        return map;
      }, {}),
    );
  }, [projectCategories]);

  return (
    <Dialog open={open} onClose={onDismiss}>
      <DialogTitle>{"Configure Category-Class Mapping"}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {"Map project categories to the model's pretrained classes"}
        </DialogContentText>
        <Stack sx={{ maxHeight: "400px", overflowY: "scroll", px: 2, py: 2 }}>
          {modelClasses.length > 0 ? (
            Object.values(modelClasses).map((idx) => (
              <Stack
                key={`model-class-${idx}`}
                direction="row"
                justifyContent="space-between"
                px={2}
              >
                <Typography variant="body2">{idx}</Typography>
                <StyledSelect
                  value={catMap[+idx]}
                  onChange={(event) => handleSelectChange(event, +idx)}
                  disabled={shouldCreateCategories}
                >
                  {projectCategories.map((category) => (
                    <MenuItem
                      key={category.id}
                      dense
                      value={category.id}
                      disabled={assignedClasses.includes(category.id)}
                      sx={{
                        borderRadius: 0,
                        minHeight: "1rem",
                      }}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </StyledSelect>
              </Stack>
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{ width: "100%" }}
              textAlign="center"
            >
              No categories to map
            </Typography>
          )}
        </Stack>
        <Stack direction="row" justifyContent="center">
          <FormControl size="small">
            <FormControlLabel
              sx={(theme) => ({
                fontSize: theme.typography.body2.fontSize,
                width: "max-content",
                ml: 0,
              })}
              control={
                <Checkbox
                  checked={shouldCreateCategories}
                  onChange={() => setShouldCreateCategories((value) => !value)}
                  color="primary"
                />
              }
              label="Create new categories from model classes?"
              disableTypography
              disabled={projectCategories.length === 0}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss}>Cancel</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={handleConfirmation}
          disabled={!shouldCreateCategories && isObjectEmpty(catMap)}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
