import { useState } from "react";

import type { ColorResult } from "react-color";

import { Box, TextField } from "@mui/material";

import { ConfirmationDialog } from "components/dialogs";
import { ColorPicker } from "components/ui/ColorPicker";

import { getRandomHex } from "utils/colorUtils";
import { representsUnknown } from "utils/stringUtils";

import { useNameValidation } from "./useNameValidation";

import type { TaxonomyDialogRequest } from "./types";

type TaxonomyDialogProps = {
  request: TaxonomyDialogRequest | null;
  onClose: () => void;
  onSave: (name: string, color?: string) => void;
};

export const TaxonomyDialog = ({
  request,
  onClose,
  onSave,
}: TaxonomyDialogProps) =>
  request ? (
    <TaxonomyDialogForm request={request} onClose={onClose} onSave={onSave} />
  ) : null;

const ENTITY_LABEL = { kind: "kind", cat: "category" } as const;
const TYPE_TITLE = { kind: "Kind", cat: "Category" } as const;
const TaxonomyDialogForm = ({
  request,
  onClose,
  onSave,
}: TaxonomyDialogProps & { request: TaxonomyDialogRequest }) => {
  const { name, handleNameChange, isInvalidName, errorHelperText } =
    useNameValidation({
      initName: request.name,
      existingNames: request.existingNames,
      entityLabel: ENTITY_LABEL[request.type],
    });

  const [color, setColor] = useState(() =>
    request.type === "cat" && request.mode === "edit"
      ? request.color
      : getRandomHex(),
  );

  const canUpdateName =
    request.mode === "create" ||
    (request.type === "kind" && !representsUnknown(request.kindId)) ||
    (request.type === "cat" && !representsUnknown(request.catId));

  return (
    <ConfirmationDialog
      isOpen
      maxWidth="xs"
      keepMounted={false}
      title={`${request.mode === "create" ? "Create" : "Edit"} ${TYPE_TITLE[request.type]}`}
      onClose={onClose}
      onConfirm={() =>
        onSave(name.trim(), request.type === "cat" ? color : undefined)
      }
      confirmDisabled={isInvalidName}
      content={
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          {request.type === "cat" && (
            <ColorPicker
              color={color}
              onColorChange={(c: ColorResult) => setColor(c.hex)}
            />
          )}
          <TextField
            data-testid="taxonomy-name-input"
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
            disabled={!canUpdateName}
          />
        </Box>
      }
    />
  );
};
