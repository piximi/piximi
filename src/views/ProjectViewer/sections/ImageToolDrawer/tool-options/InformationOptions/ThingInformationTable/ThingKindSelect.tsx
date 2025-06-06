import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { MenuItem, SelectChangeEvent } from "@mui/material";

import { StyledSelect } from "components/inputs";
import { StyledSelectProps } from "components/inputs/StyledSelect";
import { selectAllKinds } from "store/data/selectors";
import { selectRenderKindName } from "store/data/selectors";

export const ThingKindSelect = ({
  currentKind,
  callback,
  ...rest
}: {
  currentKind: string;
  callback: (kindId: string, newCategoryId: string) => void;
} & StyledSelectProps) => {
  const kinds = useSelector(selectAllKinds);
  const renderedKindName = useSelector(selectRenderKindName);
  const [selectedKind, setSelectedKind] = useState<string>(
    renderedKindName(currentKind),
  );

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newKindId = event.target.value as string;
    setSelectedKind(newKindId);

    if (currentKind !== newKindId) {
      const newKind = kinds.find((kind) => kind.id === newKindId);
      if (!newKind) {
        throw new Error('Selected Kinds has no "Unknown" category');
      }
      const newCatId = newKind.unknownCategoryId;

      callback(newKindId, newCatId);
    }
  };
  useEffect(() => {
    setSelectedKind(currentKind);
  }, [currentKind]);

  return (
    <StyledSelect
      {...rest}
      value={selectedKind}
      onChange={(event) => handleChange(event)}
    >
      {Object.values(kinds).map((kind) => (
        <MenuItem key={`im-cat-select-${kind.id}`} value={kind.id} dense>
          {renderedKindName(kind.id)}
        </MenuItem>
      ))}
    </StyledSelect>
  );
};
