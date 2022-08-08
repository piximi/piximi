import React, { ChangeEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ColorResult } from "react-color";
import { sample } from "lodash";
import { useHotkeys } from "react-hotkeys-hook";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Box,
} from "@mui/material";

import { ColorIcon } from "components/category/ColorIcon";

import { availableColorsSelector, categoriesSelector } from "store/selectors";

import { createCategory } from "store/slices";

import { Category } from "types";

type CreateCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const CreateCategoryDialog = ({
  onClose,
  open,
}: CreateCategoryDialogProps) => {
  const dispatch = useDispatch();

  const availableColors = useSelector(availableColorsSelector);
  const usedCategoryNames = useSelector(categoriesSelector).map(
    (category: Category) => category.name
  );

  const [color, setColor] = useState<string>(sample(availableColors)!);
  const [name, setName] = useState<string>("");
  const [errorHelperText, setErrorHelperText] = useState<string>("");
  const [invalidName, setInvalidName] = useState<boolean>(false);

  const onCloseDialog = () => {
    setErrorHelperText("");
    setName("");
    setInvalidName(false);
    setColor(sample(availableColors)!);

    onClose();
  };

  const onCreate = () => {
    if (validateInput(name)) {
      dispatch(createCategory({ name: name, color: color }));

      onCloseDialog();
    }
  };

  const onColorChange = (color: ColorResult) => {
    setColor(color.hex);
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);

    validateInput(event.target.value);
  };

  const validateInput = (categoryName: string) => {
    let validInput = true;
    let helperText = "";

    if (categoryName === "") {
      helperText = "Please type a category name.";
      validInput = false;
    } else if (usedCategoryNames.includes(categoryName)) {
      helperText =
        "Category names must be unique. A category with this name already exits.";
      validInput = false;
    }

    setErrorHelperText(helperText);
    setInvalidName(!validInput);
    return validInput;
  };

  useHotkeys(
    "enter",
    () => {
      onCreate();
    },
    { enabled: open },
    [onCreate]
  );

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onCloseDialog} open={open}>
      <DialogTitle>Create category</DialogTitle>

      <DialogContent sx={{ paddingLeft: "0 !important" }}>
        <Box sx={{ margin: (theme) => theme.spacing(1) }}>
          <Grid container spacing={1}>
            <Grid item xs={2}>
              <ColorIcon color={color} onColorChange={onColorChange} />
            </Grid>
            <Grid item xs={10}>
              <TextField
                error={invalidName}
                autoFocus
                fullWidth
                id="name"
                label="Name"
                margin="dense"
                onChange={onNameChange}
                helperText={errorHelperText}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCloseDialog} color="primary">
          Cancel
        </Button>

        <Button onClick={onCreate} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
