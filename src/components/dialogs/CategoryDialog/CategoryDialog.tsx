import { TextField, Box } from "@mui/material";

import { ConfirmationDialog } from "../ConfirmationDialog";
import { useCategoryValidation } from "hooks/useCategoryValidation/useCategoryValidation";
import { ColorIcon } from "components/controls";

type CategoryDialogProps = {
  onClose: () => void;
  onConfirm: (name: string, color: string, kind: string) => void;
  initName?: string;
  initColor?: string;
  action: "Create" | "Update";
  kind: string;
  id?: string;
  open: boolean;
};

export const CategoryDialog = ({
  onClose,
  onConfirm,
  kind,
  action,
  initName,
  initColor,
  id,
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
  } = useCategoryValidation({ kind, initName, initColor });

  const handleConfirm = () => {
    if (!isInvalidName) {
      onConfirm(name, color, kind);
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
