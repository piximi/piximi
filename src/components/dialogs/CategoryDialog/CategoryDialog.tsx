import { TextField, Box } from "@mui/material";

import { DialogWithAction } from "../DialogWithAction";
import { useCategoryValidation } from "hooks/useCategoryValidation/useCategoryValidation";
import { ColorIconNew } from "components/controls/ColorIcon/ColorIconNew";

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

//TODO: If category exists in other kind, dont show error, update list of categories in kind
//TODO: Same for updating. If editing a category which exists in other kinds, create new category instead.
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
  } = useCategoryValidation({ kind, initName, initColor });

  const handleConfirm = () => {
    onConfirm(name, color, kind);
  };

  return (
    <DialogWithAction
      onClose={onClose}
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
          <ColorIconNew
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
