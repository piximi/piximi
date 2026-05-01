import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { isMatch } from "lodash";
import { ColorResult } from "react-color";

import { selectAllCategories } from "store/dataV2/selectors";
import { getRestrictedRandomHex } from "utils/colorUtils";

export function useCategoryValidation({
  initName,
  initColor,
  options,
}: {
  initName?: string;
  initColor?: string;
  options: { type: "image" } | { type: "annotation"; kindId: string };
}) {
  const categories = useSelector(selectAllCategories);
  const { existingNames, existingColors } = useMemo(() => {
    const existingNames: string[] = [];
    const existingColors: string[] = [];
    categories.forEach((cat) => {
      if (isMatch(cat, options)) {
        existingNames.push(cat.name);
        existingColors.push(cat.color);
      }
    });
    return { existingNames, existingColors };
  }, [categories, options]);
  const [color, setColor] = useState(initColor ?? "");
  const [name, setName] = useState(initName ?? "");
  const [errorHelperText, setErrorHelperText] = useState(" "); // leave space for rendering

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
        existingNames.includes(categoryName)
      ) {
        helperText = "A category with this name already exits.";
        invalidInput = true;
      }
      return { isInvalid: invalidInput, helperText };
    },
    [initName, existingNames],
  );

  useEffect(() => {
    const { isInvalid, helperText } = validateInput(name);
    setErrorHelperText(helperText);
    setIsInvalidName(isInvalid);
  }, [name, validateInput]);

  useEffect(() => {
    if (!initColor) setColor(getRestrictedRandomHex(existingColors));
  }, [existingColors, initColor]);

  return {
    name,
    color,
    handleNameChange,
    handleColorChange,
    isInvalidName,
    errorHelperText,
    existingColors,
    setName,
  };
}
