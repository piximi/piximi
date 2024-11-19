import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { Box, TextField } from "@mui/material";

import { ConfirmationDialog } from "components/ConfirmationDialog";

import { dataSlice } from "store/data/dataSlice";
import { selectAllKindIds } from "store/data/selectors";
import { Kind } from "store/data/types";

import { generateUnknownCategory } from "utils/common/helpers";

type CreateCategoriesDialogProps = {
  onClose: () => void;
  withContainedThings?: string[];
  withContainedCategories?: string[];
  open: boolean;
  changesPermanent?: boolean;
  secondaryAction?: () => void;
};

export const CreateKindDialog = ({
  onClose,
  withContainedThings = [],
  withContainedCategories = [],
  open,
  changesPermanent,
  secondaryAction,
}: CreateCategoriesDialogProps) => {
  const dispatch = useDispatch();
  const existingKinds = useSelector(selectAllKindIds);
  const [name, setName] = useState<string>("");
  const [errorHelperText, setErrorHelperText] = useState<string>(" ");
  const [isInvalidName, setIsInvalidName] = useState<boolean>(false);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  const validateInput = useCallback(
    (categoryName: string) => {
      let validInput = true;
      let helperText = " ";

      if (categoryName === "") {
        helperText = "Please type a kind name.";
        validInput = false;
      } else if (
        existingKinds
          .map((kind) => kind.toString().toUpperCase())
          .includes(categoryName.toUpperCase())
      ) {
        helperText =
          "Kind names must be unique. A kind with this name already exits.";
        validInput = false;
      }
      setErrorHelperText(helperText);
      setIsInvalidName(!validInput);
      return validInput;
    },
    [existingKinds]
  );

  const handleConfirm = () => {
    const newUnknownCategory = generateUnknownCategory(name);
    const kind: Kind = {
      id: name,
      categories: [...withContainedCategories, newUnknownCategory.id],
      containing: withContainedThings,
      unknownCategoryId: newUnknownCategory.id,
    };

    batch(() => {
      dispatch(
        dataSlice.actions.addCategories({
          categories: [newUnknownCategory],
          isPermanent: changesPermanent,
        })
      );

      dispatch(
        dataSlice.actions.addKinds({
          kinds: [kind],
          isPermanent: changesPermanent,
        })
      );
    });
    secondaryAction && secondaryAction();

    handleClose();
  };

  useEffect(() => {
    validateInput(name);
  }, [existingKinds, name, validateInput]);

  return (
    <ConfirmationDialog
      onClose={handleClose}
      isOpen={open}
      title={"Create Kind"}
      content={
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems={"center"}
          gap={2}
        >
          <TextField
            error={isInvalidName && name !== ""}
            autoComplete="off"
            autoFocus
            fullWidth
            value={name}
            id="name"
            label="Name"
            margin="dense"
            variant="standard"
            onChange={handleNameChange}
            helperText={errorHelperText}
          />
        </Box>
      }
      onConfirm={handleConfirm}
      confirmDisabled={isInvalidName}
    />
  );
};
