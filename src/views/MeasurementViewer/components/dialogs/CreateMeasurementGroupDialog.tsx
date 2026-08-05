import type React from "react";
import { useMemo, useState } from "react";

import { Autocomplete, FormControl, TextField } from "@mui/material";

import { ConfirmationDialog } from "components/dialogs";
import { useSelector } from "react-redux";
import { selectAllKinds } from "store/dataV2/selectors";

type KindOption = { id: string; name: string };

type SelectDialogProps = {
  onClose: () => void;
  onConfirm: (kindId: string, name: string) => void;
  selectLabel: string;
  title: string;
  open: boolean;
};

export const CreateMeasurementGroupDialog = ({
  onClose,
  onConfirm,
  selectLabel,
  title,
  open,
}: SelectDialogProps) => {
  const kinds = useSelector(selectAllKinds);
  const kindOptions = useMemo(
    () =>
      [
        { id: "image", name: "Images" },
        ...kinds.map((k) => ({ id: k.id, name: k.name })),
      ] as KindOption[],
    [kinds],
  );
  const [currentOption, setCurrentOption] = useState<KindOption>(
    kindOptions[0],
  );

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
            options={kindOptions}
            sx={{ width: 300 }}
            value={currentOption}
            onChange={handleOptionsChange}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} label={selectLabel} />
            )}
            blurOnSelect
            openOnFocus
            size="small"
          />
        </FormControl>
      }
      onConfirm={() => onConfirm(currentOption.id, currentOption.name)}
      confirmText="Confirm"
      disableHotkeyOnInput
    />
  );
};
