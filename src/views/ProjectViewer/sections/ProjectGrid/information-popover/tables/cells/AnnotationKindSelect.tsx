import { useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { MenuItem } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { selectAllKinds } from "store/dataV2/selectors";

import { SELECT_PROPS } from "./utils";

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
