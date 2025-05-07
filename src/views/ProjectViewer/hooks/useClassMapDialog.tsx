import {
  Autocomplete,
  Button,
  createFilterOptions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  SelectChangeEvent,
  Stack,
  TextField,
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

interface FilmOptionType {
  inputValue?: string;
  displayName: string;
  id?: number;
}
const filter = createFilterOptions<FilmOptionType>();

const FreeSoloCreateOption = ({
  categories,
}: {
  categories: FilmOptionType[];
}) => {
  const [value, setValue] = React.useState<FilmOptionType | null>(null);

  console.log(value);

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        if (typeof newValue === "string") {
          setValue({
            displayName: newValue,
          });
        } else if (newValue && newValue.inputValue) {
          // Create a new value from the user input
          setValue({
            displayName: newValue.inputValue,
          });
        } else {
          setValue(newValue);
        }
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some(
          (option) => inputValue === option.displayName,
        );
        if (inputValue !== "" && !isExisting) {
          filtered.push({
            inputValue,
            displayName: `Add "${inputValue}"`,
          });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      id="free-solo-with-text-demo"
      options={categories}
      getOptionLabel={(option) => {
        // Value selected with enter, right from the input
        if (typeof option === "string") {
          return option;
        }
        // Add "xxx" option created dynamically
        if (option.inputValue) {
          return option.inputValue;
        }
        // Regular option
        return option.displayName;
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            {option.displayName}
          </li>
        );
      }}
      sx={{ width: 300 }}
      freeSolo
      renderInput={(params) => (
        <TextField {...params} label="Free solo with text demo" />
      )}
    />
  );
};

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
  const activeKindId = useSelector(selectActiveKindId);
  const availableCategoryColors = useSelector(selectAvaliableCategoryColors);

  const createNewCategories = () => {
    const newCategories: Category[] = [];
    const classMap: ModelClassMap = {};
    modelClasses.forEach((className, idx) => {
      let color = availableCategoryColors.pop();
      if (!color) {
        const choices = Object.values(CATEGORY_COLORS);
        color = choices[getRandomInt(0, choices.length)] as string;
      }
      const cat = generateCategory(className, activeKindId, color);
      newCategories.push(cat);
      classMap[idx] = cat.id;
    });

    dispatch(dataSlice.actions.addCategories({ categories: newCategories }));
    onConfirm(classMap);
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
            Object.keys(modelClasses).map((idx) => (
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
          <Button
            onClick={createNewCategories}
            sx={{ fontSize: (theme) => theme.typography.body2.fontSize }}
          >
            Create from Model Classes
          </Button>
        </Stack>
        <FreeSoloCreateOption
          categories={projectCategories.map((cat, idx) => {
            return { displayName: cat.name, id: idx } as FilmOptionType;
          })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss}>Cancel</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => onConfirm(catMap)}
          disabled={isObjectEmpty(catMap)}
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

export default ClassMapDialog;
export { ClassMapDialogProvider, useClassMapDialog };
