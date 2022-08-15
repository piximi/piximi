import * as React from "react";

import { TextField } from "@mui/material";

const intRegExpr = new RegExp("^[0-9]+(.0*)?$");
const floatRegExpr = new RegExp("-*^[0-9]*(.[0-9]*)?$");

type CustomNumberTextFieldProps = {
  id: string;
  label: string;
  value: number;
  dispatchCallBack: (arg: number) => void;
  min?: number;
  max?: number;
  enableFloat?: boolean;
  disabled?: boolean;
};

/**
 * @param {string} id
 * @param {string} label
 * @param {number} value
 * @param {(arg: number) => void} dispatchCallBack callback to dispatch the selected value to the store
 * @param {number} [min=Number.MIN_SAFE_INTEGER]
 * @param {number} [max=Number.MIN_SAFE_INTEGER]
 * @param {boolean} [enableFloat=false] allow floating point values
 * @param {boolean} [disabled=false] disable the input field
 * @returns
 */
export const CustomNumberTextField = ({
  id,
  label,
  value,
  dispatchCallBack,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  enableFloat = false,
  disabled = false,
}: CustomNumberTextFieldProps) => {
  const [valueString, setValueString] = React.useState<string>(
    value.toString()
  );

  React.useEffect(() => {
    setValueString(value.toString());
  }, [value]);

  const [inputValue, setInputValue] = React.useState<number>(value);

  const [inputError, setInputError] = React.useState<boolean>(false);

  const regExp = enableFloat ? floatRegExpr : intRegExpr;

  var rangeHelperText = ".";
  if (min !== Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
    rangeHelperText = ` between ${min} and ${max}.`;
  } else if (min !== Number.MIN_SAFE_INTEGER) {
    rangeHelperText = ` ${min} or above.`;
  } else if (max !== Number.MAX_SAFE_INTEGER) {
    rangeHelperText = ` ${max} or below.`;
  }

  const errorHelpText = `${label} must be a ${
    enableFloat ? "floating point" : "integer"
  } value${rangeHelperText}`;

  const onInputChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const inputString = target.value;

    setValueString(inputString);

    if (!regExp.test(target.value) || target.value === "") {
      setInputError(true);
      return;
    }

    const arg = Number(inputString);

    if (isNaN(arg) || arg < min || arg > max) {
      setInputError(true);
      return;
    }

    setInputError(false);
    setInputValue(arg);
  };

  const dispatchValue = () => {
    dispatchCallBack(inputValue);
  };

  return (
    <TextField
      id={id}
      onBlur={dispatchValue}
      label={label}
      sx={(theme) => ({
        marginRight: theme.spacing(1),
        flexBasis: 300,
        marginTop: theme.spacing(2.75),
        width: "100%",
      })}
      error={inputError}
      helperText={inputError ? errorHelpText : ""}
      value={valueString}
      onChange={onInputChange}
      type="text"
      margin="normal"
      autoComplete="off"
      disabled={disabled}
    />
  );
};
