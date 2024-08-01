import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { sample } from "lodash";
import { ColorResult } from "react-color";
import { useSelector } from "react-redux";
import {
  selectActiveCategoryColors,
  selectActiveCategoryNames,
} from "store/project/reselectors";

export function useCategoryValidation({
  initName,
  initColor,
  kind,
}: {
  initName?: string;
  initColor?: string;
  kind: string;
}) {
  const unavailableNames = useSelector(selectActiveCategoryNames);
  const availableColors = useSelector(selectActiveCategoryColors);
  const [color, setColor] = useState<string>(
    initColor ?? "" //sample(availableColors)!
  );
  const [name, setName] = useState<string>(initName ?? "");
  const [errorHelperText, setErrorHelperText] = useState<string>(" ");
  const [isInvalidName, setIsInvalidName] = useState<boolean>(false);

  const handleColorChange = (color: ColorResult) => {
    setColor(color.hex);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const validateInput = useCallback(
    (categoryName: string) => {
      let invalidInput = false;
      let helperText = " ";

      if (categoryName === "") {
        helperText = "Please type a category name.";
        invalidInput = true;
      } else if (
        categoryName !== initName &&
        unavailableNames.includes(categoryName)
      ) {
        helperText = "A category with this name already exits.";
        invalidInput = true;
      }
      return { isInvalid: invalidInput, helperText };
    },
    [initName, unavailableNames]
  );

  useEffect(() => {
    const { isInvalid, helperText } = validateInput(name);
    setErrorHelperText(helperText);
    setIsInvalidName(isInvalid);
  }, [name, validateInput]);

  useEffect(() => {
    if (!initColor) setColor(sample(availableColors)!);
  }, [availableColors, initColor]);

  return {
    name,
    color,
    handleNameChange,
    handleColorChange,
    isInvalidName,
    errorHelperText,
    availableColors,
    setName,
  };
}
