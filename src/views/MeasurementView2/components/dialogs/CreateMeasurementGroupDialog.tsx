import React, { useState } from "react";
import { Autocomplete, FormControl, TextField } from "@mui/material";
import { ConfirmationDialog } from "components/dialogs";

type KindOption = { kindId: string; displayName: string };

type SelectDialogProps = {
  options: KindOption[];
  onClose: () => void;
  onConfirm: (options: string) => void;
  selectLabel: string;
  title: string;
  open: boolean;
  getOptionLabel?: (option: KindOption) => string;
};

export const CreateMeasurementGroupDialog = ({
  options,
  onClose,
  onConfirm,
  selectLabel,
  title,
  open,
}: SelectDialogProps) => {
  const [currentOption, setCurrentOption] = useState<KindOption>(options[0]);

  const handleOptionsChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: KindOption | null,
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
            getOptionLabel={(option) => option.displayName}
            renderInput={(params) => (
              <TextField {...params} label={selectLabel} />
            )}
            blurOnSelect
            openOnFocus
            size="small"
          />
        </FormControl>
      }
      onConfirm={() => onConfirm(currentOption.kindId)}
      confirmText="Confirm"
      disableHotkeyOnInput
    />
  );
};
