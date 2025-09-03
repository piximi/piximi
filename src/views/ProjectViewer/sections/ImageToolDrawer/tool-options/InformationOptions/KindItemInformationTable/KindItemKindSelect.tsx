import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { MenuItem, SelectChangeEvent } from "@mui/material";

import { StyledSelect } from "components/inputs";
import { StyledSelectProps } from "components/inputs/StyledSelect";
import { selectAllKinds, selectGetKindDisplayName } from "store/data/selectors";
import { IMAGE_KIND } from "store/data/constants";

export const KindItemKindSelect = ({
  currentKind,
  callback,
  ...rest
}: {
  currentKind: string;
  callback: (kindId: string) => void;
} & StyledSelectProps) => {
  const kinds = useSelector(selectAllKinds);
  const getKindDisplayName = useSelector(selectGetKindDisplayName);
  const [selectedKind, setSelectedKind] = useState<string>(
    getKindDisplayName(currentKind),
  );

  const availableKinds = useMemo(() => {
    return currentKind === IMAGE_KIND
      ? kinds
      : kinds.filter((kind) => kind.id !== IMAGE_KIND);
  }, [currentKind, kinds]);
  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newKindId = event.target.value as string;
    setSelectedKind(newKindId);

    if (currentKind !== newKindId) {
      const newKind = availableKinds.find((kind) => kind.id === newKindId);
      if (!newKind) {
        throw new Error('Selected Kinds has no "Unknown" category');
      }

      callback(newKindId);
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
      disabled={currentKind === IMAGE_KIND}
    >
      {Object.values(availableKinds).map((kind) => (
        <MenuItem key={`im-cat-select-${kind.id}`} value={kind.id} dense>
          {getKindDisplayName(kind.id)}
        </MenuItem>
      ))}
    </StyledSelect>
  );
};
