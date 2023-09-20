import React, { ChangeEvent, useEffect, useState } from "react";
import { ColorResult } from "react-color";
import { sample } from "lodash";

import { Button, TextField, Box } from "@mui/material";
import { useHotkeys } from "hooks";

import { Category, HotkeyView, PartialBy } from "types";
import { CustomDialog } from "../CustomDialog";
import { ColorIcon } from "components/controls";

type UpsertCategoriesDialogProps = {
  category?: Category;
  onClose: () => void;
  open: boolean;
  usedCategoryNames: string[];
  usedCategoryColors: string[];
  dispatchUpsertCategory: (
    category: PartialBy<Category, "id" | "visible">
  ) => void;
};

export const UpsertCategoriesDialog = ({
  onClose,
  category,
  open,
  usedCategoryNames,
  usedCategoryColors,
  dispatchUpsertCategory,
}: UpsertCategoriesDialogProps) => {
  const [color, setColor] = useState<string>(sample(usedCategoryColors)!);
  const [name, setName] = useState<string>("");
  const [errorHelperText, setErrorHelperText] = useState<string>("");
  const [invalidName, setInvalidName] = useState<boolean>(false);

  const onCloseDialog = () => {
    setErrorHelperText("");
    setName("");
    setInvalidName(false);
    setColor(sample(usedCategoryColors)!);

    onClose();
  };

  const handleConfirmAndClose = () => {
    if (validateInput(name)) {
      if (!(name === category?.name && color === category?.color)) {
        const payload = category
          ? { id: category.id, name: name, color: color }
          : { name: name, color: color };
        dispatchUpsertCategory(payload);
      }

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
    } else if (
      categoryName !== category?.name &&
      usedCategoryNames.includes(categoryName)
    ) {
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
      handleConfirmAndClose();
    },
    HotkeyView.CreateCategoryDialog,
    { enableOnTags: ["INPUT"] },
    [handleConfirmAndClose]
  );

  useEffect(() => {
    setColor(sample(usedCategoryColors)!);
  }, [usedCategoryColors]);
  useEffect(() => {
    if (category) {
      setColor(category.color);
      setName(category.name);
    }
  }, [category]);

  return (
    <CustomDialog
      onClose={onCloseDialog}
      open={open}
      title={`${category ? "Edit" : "Create"} Category`}
      content={
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          <ColorIcon
            color={color}
            unusedColors={usedCategoryColors}
            onColorChange={onColorChange}
          />

          <TextField
            error={invalidName}
            autoFocus
            fullWidth
            value={name}
            id="name"
            label="Name"
            margin="dense"
            onChange={onNameChange}
            helperText={errorHelperText}
          />
        </Box>
      }
      actions={
        <>
          <Button onClick={onCloseDialog} color="primary">
            Cancel
          </Button>

          <Button
            onClick={handleConfirmAndClose}
            color="primary"
            disabled={!validateInput}
          >
            Confirm
          </Button>
        </>
      }
    />
  );
};
