import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

export const useNameValidation = ({
  initName,
  existingNames,
  entityLabel,
}: {
  initName: string;
  existingNames: string[];
  entityLabel: string;
}) => {
  const [name, setName] = useState(initName);
  const taken = useMemo(
    () => new Set(existingNames.map((n) => n.trim().toUpperCase())),
    [existingNames],
  );
  const { isInvalidName, errorHelperText } = useMemo(() => {
    const key = name.trim().toUpperCase();

    if (key === "")
      return {
        isInvalidName: true,
        errorHelperText: `Please type a ${entityLabel} name.`,
      };

    if (key !== initName.trim().toUpperCase() && taken.has(key)) {
      return {
        isInvalidName: true,
        errorHelperText: `A ${entityLabel} with this name already exists.`,
      };
    }
    return { isInvalidName: false, errorHelperText: " " };
  }, [name, initName, taken, entityLabel]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  return { name, handleNameChange, isInvalidName, errorHelperText };
};
