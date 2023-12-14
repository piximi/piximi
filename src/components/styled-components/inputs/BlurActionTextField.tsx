import { useRef, useState } from "react";
import { StyledTextField, StyledTextFieldProps } from "./StyledTextField";

export const BlurActionTextField = ({
  currentText,
  callback,
  ...rest
}: {
  currentText: string;
  callback: (name: string) => void;
} & StyledTextFieldProps) => {
  const [newText, setNewText] = useState<string>(currentText);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewText(event.target.value);
  };
  const handleBlur = () => {
    console.log("Im blur"); //LOG:
    if (currentText === newText) return;
    console.log("I made it past the blur check"); //LOG:
    callback(newText);
  };
  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      console.log("Im enter"); //LOG:
      inputRef.current?.blur();
    }
  };

  return (
    <StyledTextField
      {...rest}
      inputRef={inputRef}
      value={newText}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleEnter}
    />
  );
};
