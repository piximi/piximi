import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { sample } from "lodash";
import { ColorResult } from "react-color";
import { useSelector } from "react-redux";
import {
  selectActiveCategoryColors,
  selectActiveCategoryNames,
} from "store/data/selectors/reselectors";

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
    validateInput(event.target.value);
  };

  const validateInput = useCallback(
    (categoryName: string) => {
      let validInput = true;
      let helperText = " ";

      if (categoryName === "") {
        helperText = "Please type a category name.";
        validInput = false;
      } else if (
        categoryName !== initName &&
        unavailableNames.includes(categoryName)
      ) {
        helperText =
          "Category names must be unique. A category with this name already exits.";
        validInput = false;
      }
      setErrorHelperText(helperText);
      setIsInvalidName(!validInput);
      return validInput;
    },
    [initName, unavailableNames]
  );

  useEffect(() => {
    validateInput(name);
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
