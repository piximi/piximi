import { TextField, Box } from "@mui/material";

import { useCategoryValidation } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { ColorIcon } from "components/ui/ColorIcon";

type BaseCategoryDialogProps = {
  onClose: () => void;
  onConfirm: (kindOrId: string, name: string, color: string) => void;

  open: boolean;
};
type CreateCategoryDialogProps = BaseCategoryDialogProps & {
  action: "create";
  kind: string;
};

export const CategoryDialog = ({
  onClose,
  onConfirm,
  kind,
  action,
  initName,
  initColor,
  id: _id,
  open,
}: CategoryDialogProps) => {
  const {
    name,
    color,
    handleNameChange,
    handleColorChange,
    isInvalidName,
    errorHelperText,
    availableColors,
    setName,
  } = useCategoryValidation({
    initName: isEditMode ? props.initName : "",
    initColor: isEditMode ? props.initColor : "",
  });

  const handleConfirm = () => {
    if (!isInvalidName) {
      if (isEditMode) {
        onConfirm(props.id, name, color);
      } else {
        onConfirm(props.kind, name, color);
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
      title={`${action} Category`}
      content={
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems={"center"}
          gap={2}
        >
          <ColorIcon
            color={color}
            unusedColors={availableColors}
            onColorChange={handleColorChange}
          />
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
