import { TextField } from "@mui/material";
import * as React from "react";
import { useStyles } from "./CustomNumberTextFiel.css";

const intRegExpr = new RegExp("^[0-9]+$");
const floatRegExpr = new RegExp("^[0-9]+(.[0-9]*)?$");

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
  const classes = useStyles();
  const [valueString, setValueString] = React.useState<string>(
    value.toString()
  );

  const regExp = enableFloat ? floatRegExpr : intRegExpr;

  const onInputChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const inputString = target.value;

    if (!regExp.test(target.value)) {
      return;
    }

    const arg = Number(inputString);

    if (isNaN(arg) || arg < min || arg > max) {
      return;
    }

    setValueString(inputString);
    dispatchCallBack(arg);
  };

  return (
    <TextField
      id={id}
      label={label}
      className={classes.textField}
      value={valueString}
      onChange={onInputChange}
      type="text"
      margin="normal"
      autoComplete="off"
      disabled={disabled}
    />
  );
};
