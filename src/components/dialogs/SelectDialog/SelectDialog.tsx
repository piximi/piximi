import React, { useState } from "react";
import { useHotkeys } from "hooks";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { HotkeyView } from "utils/common/enums";
import { DialogWithAction } from "../DialogWithAction";

type SelectDialogProps = {
  options: string[];
  onClose: () => void;
  onConfirm: (options: string) => void;
  selectLabel: string;
  title: string;
  open: boolean;
};

// TODO: Should alert since data will be deleted
export const SelectDialog = ({
  options,
  onClose,
  onConfirm,
  selectLabel,
  title,
  open,
}: SelectDialogProps) => {
  const [currentOption, setCurrentOption] = useState(options[0]);

  const handleChange = (event: SelectChangeEvent) => {
    setCurrentOption(event.target.value as string);
  };

  const closeDialog = () => {
    onClose();
  };

  useHotkeys(
    "enter",
    () => onConfirm(currentOption),
    HotkeyView.NewProjectDialog,
    { enableOnTags: ["INPUT"] },
    [onConfirm]
  );

  return (
    <DialogWithAction
      onClose={closeDialog}
      isOpen={open}
      title={title}
      content={
        <FormControl fullWidth>
          <InputLabel id="dialog-select-label">{selectLabel}</InputLabel>
          <Select
            labelId="dialog-select-label"
            id="dialog-select"
            value={currentOption}
            label={selectLabel}
            onChange={handleChange}
          >
            {options.map((option) => (
              <MenuItem
                key={`${title}-select-dialog-menu-item-${option}`}
                value={option}
              >
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      }
      onConfirm={() => onConfirm(currentOption)}
      confirmText="Confirm"
    />
  );
};
