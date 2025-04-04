import { useState } from "react";

const intRegExpr = new RegExp("^[0-9]+(.0*)?$");
const floatRegExpr = new RegExp("-*^[0-9]*(.[0-9]*)?$");
type ValidationError = { error: false } | { error: true; message: string };
type ValidationOptions = {
  min?: number;
  max?: number;
  float?: boolean;
  extraValidation?: (value: string) => ValidationError;
};
const validateInput = (
  input: string,
  options: ValidationOptions = {
    min: 0,
    max: 100,
    float: false,
  },
): ValidationError => {
  const rangeAssertion: string = ` between ${options.min} and ${options.max}`;

  const defaultErrorMessage = `Must be a${
    options.float ? " floating point" : "n integer"
  } ${rangeAssertion}`;

  const regExp = options.float ? floatRegExpr : intRegExpr;
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
  const [inputValue, setInputValue] = useState<number>(initialValue);
  const [error, setError] = useState<ValidationError>({
    error: false,
  });

  const handleOnChangeValidation = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const inputString = event.target.value;

    const validationResults = validateInput(inputString, options);
    if (validationResults.error) return;
    setInputValue(Number(inputString));

    setError(validationResults);
  };

  const resetInputValue = () => {
    setInputValue(initialValue);
    setError({ error: false });
  };
  return { inputValue, resetInputValue, handleOnChangeValidation, error };
};
