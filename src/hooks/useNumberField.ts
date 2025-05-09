import { useState } from "react";

const intRegExpr = new RegExp("^[0-9]+$");
const floatRegExpr = new RegExp("-*^[0-9]*(.[0-9]*)?$");
type ValidationError = { error: false } | { error: true; message: string };
type ValidationOptions = {
  min?: number;
  max?: number;
  enableFloat?: boolean;
  extraValidation?: (value: string) => ValidationError;
};
const validateInput = (
  input: string,
  options: ValidationOptions = {
    min: 0,
    max: 100,
    enableFloat: false,
  },
): ValidationError => {
  const rangeAssertion: string = ` between ${options.min} and ${options.max}`;

  const defaultErrorMessage = `Must be a${
    options.enableFloat ? " floating point" : "n integer"
  } ${rangeAssertion}`;

  const regExp = options.enableFloat ? floatRegExpr : intRegExpr;

  if (!regExp.test(input) || input === "") {
    return {
      error: true,
      message: defaultErrorMessage,
    };
  }

  const inputAsNumber = Number(input);

  if (
    isNaN(inputAsNumber) ||
    inputAsNumber < options.min! ||
    inputAsNumber > options.max!
  ) {
    return { error: true, message: defaultErrorMessage };
  }
  if (options.extraValidation) {
    return options.extraValidation(input);
  }
  return { error: false };
};

export const useNumberField = (
  initialValue: number,
  options: {
    min?: number;
    max?: number;
    enableFloat?: boolean;
    errorChecker?: (value: string) => ValidationError;
  } = {
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    enableFloat: false,
  },
) => {
  const [inputString, setInputString] = useState<string>("" + initialValue);
  const [inputValue, setInputValue] = useState<number>(initialValue);
  const [lastValidInput, setLastValidInput] = useState<number>(initialValue);
  const [error, setError] = useState<ValidationError>({
    error: false,
  });

  const handleOnChangeValidation = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const inputString = event.target.value;

    setInputString(inputString);
    const validationResults = validateInput(inputString, options);
    if (!validationResults.error) {
      setInputValue(+inputString);
    }
    setError(validationResults);
  };

  const resetInputValue = () => {
    setInputValue(lastValidInput);
    setInputString("" + lastValidInput);
    setError({ error: false });
  };
  return {
    inputValue,
    inputString,
    resetInputValue,
    setLastValidInput,
    handleOnChangeValidation,
    error,
  };
};
