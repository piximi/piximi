import { Fragment, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  FormControl,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import { generateCategory } from "core/entities";

import { StyledSelect } from "components/inputs";
import { DialogTitleBar } from "components/ui/DialogTitleBar";

import { dataSlice } from "store/data";
import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";

import { getRestrictedRandomHex } from "utils/colorUtils";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import type { SelectChangeEvent } from "@mui/material";

import type { Category } from "core/entities";
import type { ModelClassMap } from "core/dl/classification/types";

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
  const [catMap, setCatMap] = useState<ModelClassMap>(() =>
    Object.fromEntries(modelClasses.map((_, idx) => [idx, ""])),
  );
  const assignedCategoryIds = new Set(Object.values(catMap).filter(Boolean));
  const [shouldCreateCategories, setShouldCreateCategories] = useState<boolean>(
    projectCategories.length === 0,
  );
  const modelTarget = useSelector(selectActiveClassifierModelTarget);

  const handleConfirmation = () => {
    if (shouldCreateCategories) {
      const newCategories: Category[] = [];
      const confirmedCatMap: ModelClassMap = {};
      const existingColors: string[] = [];
      modelClasses.forEach((className, idx) => {
        let cat: Category;
        const color = getRestrictedRandomHex(existingColors);
        existingColors.push(color);
        if (modelTarget === IMAGE_CLASSIFIER_ID) {
          cat = generateCategory(className, color, { type: "image" });
        } else {
          cat = generateCategory(className, color, {
            type: "annotation",
            kindId: modelTarget,
          });
        }
        newCategories.push(cat);
        confirmedCatMap[idx] = cat.id;
      });
      dispatch(dataSlice.actions.batchAddCategory(newCategories));
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
  };

  return (
    <Dialog open={open} onClose={onDismiss}>
      <DialogTitleBar
        title="Configure Category-Class Mapping"
        closeDialog={onDismiss}
      />
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {"Map project categories to the model's pretrained classes"}
        </DialogContentText>

        {modelClasses.length > 0 ? (
          <Box sx={{ width: "60%", mx: "auto", mb: 2 }}>
            <Grid
              container
              rowSpacing={1}
              sx={{
                borderBottom: "1px solid var(--mui-palette-text-primary)",
                mb: 1,
              }}
            >
              <Grid size={6}>
                <Typography variant="body2">Model Classes</Typography>
              </Grid>
              <Grid size={6} sx={{ justifyContent: "flex-end" }}>
                <Typography variant="body2" sx={{ textAlign: "right" }}>
                  Project Categories
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ px: 2, maxHeight: "300px", overflowY: "scroll" }}>
              <Grid container rowSpacing={1}>
                {modelClasses.map((className, idx) => (
                  <Fragment key={`model-class-${idx}`}>
                    <Grid size={6}>
                      <Typography variant="body2">{className}</Typography>
                    </Grid>
                    <Grid
                      size={6}
                      sx={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <StyledSelect
                        value={catMap[idx]}
                        variant="standard"
                        onChange={(event) => handleSelectChange(event, idx)}
                        disabled={shouldCreateCategories}
                      >
                        {projectCategories.map((category) => (
                          <MenuItem
                            key={category.id}
                            dense
                            value={category.id}
                            disabled={assignedCategoryIds.has(category.id)}
                            sx={{
                              borderRadius: 0,
                              minHeight: "1rem",
                            }}
                          >
                            {category.name}
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </Grid>
                  </Fragment>
                ))}
              </Grid>
            </Box>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              width: "100%",
            }}
          >
            No categories to map
          </Typography>
        )}

        <Stack
          direction="row"
          sx={{
            justifyContent: "center",
          }}
        >
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
          disabled={
            (!shouldCreateCategories && Object.values(catMap).includes("")) ||
            modelClasses.length === 0
          }
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
