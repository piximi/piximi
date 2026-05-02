import { TextField, Box } from "@mui/material";

import { useCategoryValidation } from "hooks/useCategoryValidation";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { ColorPicker } from "components/ui/ColorPicker";
import { formatString } from "utils/stringUtils";

type BaseCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
  options: { type: "image" } | { type: "annotation"; kindId: string };
};
type CreateCategoryDialogProps = BaseCategoryDialogProps & {
  action: "create";
  onConfirm: (name: string, color: string) => void;
};

type UpdateCategoryDialogProps = BaseCategoryDialogProps & {
  action: "edit";
  initName: string;
  initColor: string;
  id: string;
  onConfirm: (id: string, name: string, color: string) => void;
};

export const CategoryDialog = (
  props: CreateCategoryDialogProps | UpdateCategoryDialogProps,
) => {
  const { onClose, onConfirm, action, open, options } = props;
  const isEditMode = action === "edit";
  const {
    name,
    color,
    handleNameChange,
    handleColorChange,
    isInvalidName,
    errorHelperText,
    setName,
  } = useCategoryValidation({
    initName: isEditMode ? props.initName : "",
    initColor: isEditMode ? props.initColor : "",
    options,
  });

  const handleConfirm = () => {
    if (!isInvalidName) {
      if (isEditMode) {
        onConfirm(props.id, name, color);
      } else {
        onConfirm(name, color);
      }
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <ConfirmationDialog
      onClose={handleClose}
      isOpen={open}
      title={formatString(`${action} Category`, " ", "every-word")}
      content={
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems={"center"}
          gap={2}
        >
          <ColorPicker color={color} onColorChange={handleColorChange} />
          <TextField
            data-testid="category-name-input"
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
      keepMounted={false}
    />
  );
};
