import React, { useState } from "react";
import { Autocomplete, FormControl, TextField } from "@mui/material";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

type SelectDialogProps = {
  options: string[];
  onClose: () => void;
  onConfirm: (options: string) => void;
  selectLabel: string;
  title: string;
  open: boolean;
  getOptionLabel?: (option: object) => string;
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
  const [currentOption, setCurrentOption] = useState<string>(options[0]);

  const handleOptionsChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: string | null,
  ) => {
    if (!newValue) return;
    setCurrentOption(newValue);
  };

  return (
    <ConfirmationDialog
      onClose={onClose}
      isOpen={open}
      title={title}
      content={
        <FormControl>
          <Autocomplete
            id={`${selectLabel}-select`}
            options={options}
            sx={{ width: 300 }}
             
            value={currentOption}
            onChange={handleOptionsChange}
            renderInput={(params) => (
              <TextField {...params} label={selectLabel} />
            )}
            blurOnSelect
            openOnFocus
            size="small"
          />
        </FormControl>
      }
      onConfirm={() => onConfirm(currentOption)}
      confirmText="Confirm"
      disableHotkeyOnInput
    />
  );
};
