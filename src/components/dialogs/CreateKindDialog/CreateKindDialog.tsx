import { batch, useDispatch, useSelector } from "react-redux";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { DialogWithAction } from "../DialogWithAction";
import { Box, TextField } from "@mui/material";
import { selectAllKindIds } from "store/slices/newData/selectors/selectors";
import { ChangeEvent, useCallback, useState } from "react";
import { generateUnknownCategory } from "utils/common/helpers";
import { Kind } from "types/Category";

type CreateCategoriesDialogProps = {
  onClose: () => void;
  withContainedThings?: string[];
  withContainedCategories?: string[];
  open: boolean;
  changesPermanent?: boolean;
};

export const CreateKindDialog = ({
  onClose,
  withContainedThings = [],
  withContainedCategories = [],
  open,
  changesPermanent,
}: CreateCategoriesDialogProps) => {
  const dispatch = useDispatch();
  const existingKinds = useSelector(selectAllKindIds);
  const [name, setName] = useState<string>("");
  const [errorHelperText, setErrorHelperText] = useState<string>(" ");
  const [isInvalidName, setIsInvalidName] = useState<boolean>(false);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    validateInput(event.target.value);
  };

  const validateInput = useCallback(
    (categoryName: string) => {
      let validInput = true;
      let helperText = " ";

      if (categoryName === "") {
        helperText = "Please type a kind name.";
        validInput = false;
      } else if (existingKinds.includes(categoryName)) {
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
        newDataSlice.actions.addCategories({
          categories: [newUnknownCategory],
          isPermanent: changesPermanent,
        })
      );

      dispatch(
        newDataSlice.actions.addKinds({
          kinds: [kind],
          isPermanent: changesPermanent,
        })
      );
    });
  };

  return (
    <DialogWithAction
      onClose={onClose}
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
      onConfirm={() => handleConfirm()}
      confirmDisabled={isInvalidName}
    />
  );
};
