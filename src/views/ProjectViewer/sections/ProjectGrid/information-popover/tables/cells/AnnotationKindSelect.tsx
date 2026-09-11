import { useSelector } from "react-redux";

import { MenuItem } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { selectAllKinds } from "store/data/selectors";

import { SELECT_PROPS } from "./utils";

import type { SelectChangeEvent } from "@mui/material";

export const AnnotationKindSelect = ({
  currentId,
  callback,
}: {
  currentId: string;
  callback: (kindId: string) => void;
}) => {
  const kinds = useSelector(selectAllKinds);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newKindId = event.target.value as string;
    if (currentId === newKindId) return;

    callback(newKindId);
  };

  return (
    <StyledSelect
      value={currentId}
      onChange={(event) => handleChange(event)}
      {...SELECT_PROPS}
    >
      {Object.values(kinds).map((kind) => (
        <MenuItem key={`ann-kind-select-${kind.id}`} value={kind.id} dense>
          {kind.name}
        </MenuItem>
      ))}
    </StyledSelect>
  );
};
