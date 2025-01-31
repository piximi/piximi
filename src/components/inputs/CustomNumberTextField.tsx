import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  FormControl,
  FormControlProps,
  FormHelperText,
  TextField,
} from "@mui/material";

const intRegExpr = new RegExp("^[0-9]+(.0*)?$");
const floatRegExpr = new RegExp("-*^[0-9]*(.[0-9]*)?$");

type CustomNumberTextFieldProps = {
  id: string;
  label: string;
  value: number;
  dispatchCallBack: (input: number) => void;
  errorChecker?: (value: string) => { isError: boolean; message: string };
  min?: number;
  max?: number;
  enableFloat?: boolean;
  disabled?: boolean;
  size?: "small" | "medium";
  width?: string;
  formControlFullWidth?: boolean;
  variant?: "filled" | "outlined" | "standard";
  formControlProps?: FormControlProps;
};

export const CustomNumberTextField = ({
  id,
  label,
  value,
  dispatchCallBack,
  errorChecker,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  enableFloat = false,
  disabled = false,
  size = "small",
  width,
  formControlFullWidth,
  variant = "outlined",
  formControlProps,
}: CustomNumberTextFieldProps) => {
  const [valueString, setValueString] = useState<string>(value.toString());

  useEffect(() => {
    setValueString(value.toString());
  }, [value]);

  const [inputValue, setInputValue] = useState<number>(value);

  const [inputError, setInputError] = useState<boolean>(false);

  const [errorHelpText, setErrorHelpText] = useState<string>(" ");

  const regExp = enableFloat ? floatRegExpr : intRegExpr;

  const rangeHelperText = useMemo(() => {
    if (min !== Number.MIN_SAFE_INTEGER && max !== Number.MAX_SAFE_INTEGER) {
      return ` between ${min} and ${max}`;
    } else if (min !== Number.MIN_SAFE_INTEGER) {
      return ` ${min} or above`;
    } else if (max !== Number.MAX_SAFE_INTEGER) {
      return ` ${max} or below`;
    }
    return "";
  }, [max, min]);

  const onInputChange = (event: FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const inputString = target.value;

    setValueString(inputString);

    if (!regExp.test(target.value) || target.value === "") {
      setErrorHelpText(
        `Must be a${
          enableFloat ? " floating point" : "n integer"
        } ${rangeHelperText}`,
      );
      setInputError(true);
      return;
    }

    const arg = Number(inputString);

    if (isNaN(arg) || arg < min || arg > max) {
      setErrorHelpText(
        `Must be a${
          enableFloat ? " floating point" : "n integer"
        } value${rangeHelperText}`,
      );
      setInputError(true);
      return;
    }

    if (errorChecker) {
      const res = errorChecker(inputString);
      if (res.isError) {
        setInputError(true);
        setErrorHelpText(res.message);
        return;
      }
    }
    setErrorHelpText(" ");
    setInputError(false);
    setInputValue(arg);
  };

  const dispatchValue = () => {
    dispatchCallBack(inputValue);
  };

  return (
    <FormControl size={size} fullWidth={formControlFullWidth}>
      <TextField
        id={id}
        onBlur={dispatchValue}
        label={label}
        error={inputError}
        value={valueString}
        onChange={onInputChange}
        type="text"
        margin="normal"
        autoComplete="off"
        disabled={disabled}
        size={size}
        sx={{
          width: width ? width : "inherit",
          ...formControlProps?.sx,
        }}
        variant={variant}
      />
      <FormHelperText error={inputError}>{errorHelpText}</FormHelperText>
    </FormControl>
  );
};
