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
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import React, { ReactElement, useEffect, useState } from "react";
import { Category } from "store/data/types";
import { StyledSelect } from "components/inputs/StyledSelect";
import { selectActiveKindId } from "store/project/selectors";
import { useDispatch, useSelector } from "react-redux";
import { generateCategory } from "store/data/utils";
import { selectAvaliableCategoryColors } from "store/project/reselectors";
import { getRandomInt } from "utils/dataUtils";
import { isObjectEmpty } from "utils/objectUtils";
import { CATEGORY_COLORS } from "store/data/constants";
import { dataSlice } from "store/data";
import { ModelClassMap } from "store/types";

const ClassMapDialog = ({
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
  const activeKindId = useSelector(selectActiveKindId);
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
        const cat = generateCategory(className, activeKindId, color);
        newCategories.push(cat);
        confirmedCatMap[idx] = cat.id;
      });
      dispatch(dataSlice.actions.addCategories({ categories: newCategories }));
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

const ClassMapDialogContext = React.createContext<{
  openDialog: ({
    projectCategories,
    modelClasses,
    actionCallback,
  }: {
    projectCategories: Category[];
    modelClasses: string[];
    actionCallback: any;
  }) => void;
}>({
  openDialog: (_config) => {},
});

const ClassMapDialogProvider = ({ children }: { children: ReactElement }) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState<{
    projectCategories: Category[];
    modelClasses: string[];
    actionCallback: any;
  }>({ projectCategories: [], modelClasses: [], actionCallback: undefined });

  const openDialog = ({
    projectCategories,
    modelClasses,
    actionCallback,
  }: {
    projectCategories: Category[];
    modelClasses: string[];
    actionCallback: any;
  }) => {
    setDialogOpen(true);
    setDialogConfig({ projectCategories, modelClasses, actionCallback });
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setDialogConfig({
      projectCategories: [],
      modelClasses: [],
      actionCallback: undefined,
    });
  };

  const onConfirm = (catMap: ModelClassMap) => {
    resetDialog();
    dialogConfig.actionCallback(catMap);
  };

  const onDismiss = () => {
    resetDialog();
    dialogConfig.actionCallback(false);
  };

  return (
    <ClassMapDialogContext.Provider value={{ openDialog }}>
      <ClassMapDialog
        open={dialogOpen}
        projectCategories={dialogConfig.projectCategories}
        modelClasses={dialogConfig.modelClasses}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
      {children}
    </ClassMapDialogContext.Provider>
  );
};

const useClassMapDialog = () => {
  const { openDialog } = React.useContext(ClassMapDialogContext);

  const getClassMap = (
    options: Omit<Parameters<typeof openDialog>[0], "actionCallback">,
  ): Promise<ModelClassMap | false> =>
    new Promise((res) => {
      openDialog({
        actionCallback: res,
        ...options,
      });
    });

  return { getClassMap };
};

export { ClassMapDialogProvider, useClassMapDialog };
