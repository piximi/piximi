import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { ColorResult } from "react-color";
import { sample } from "lodash";

import { TextField, Box } from "@mui/material";

import { Category, PartialBy } from "types";
import { ColorIcon } from "components/controls";
import { DialogWithAction } from "../DialogWithAction";

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

export const UpsertCategoryDialogNew = ({
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

  const handleConfirm = () => {
    if (!(name === category?.name && color === category?.color)) {
      const payload = category
        ? { id: category.id, name: name, color: color }
        : { name: name, color: color };
      dispatchUpsertCategory(payload);
    }

    setErrorHelperText("");
    setName("");
    setInvalidName(false);
    setColor(sample(usedCategoryColors)!);
  };

  const onColorChange = (color: ColorResult) => {
    setColor(color.hex);
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    validateInput(event.target.value);
  };

  const validateInput = useCallback(
    (categoryName: string) => {
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
    },
    [category?.name, usedCategoryNames]
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

  useEffect(() => {
    validateInput(name);
  }, [name, validateInput]);

  return (
    <DialogWithAction
      onClose={onClose}
      isOpen={open}
      title={`${category ? "Edit" : "Create"} Category`}
      content={
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems={invalidName ? "flex-start" : "center"}
          gap={2}
        >
          <ColorIcon
            color={color}
            unusedColors={usedCategoryColors}
            onColorChange={onColorChange}
          />

          <TextField
            error={invalidName}
            autoComplete="off"
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
      onConfirm={handleConfirm}
      confirmDisabled={invalidName}
    />
  );
};
