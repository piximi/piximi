import { useEffect, useRef, useState } from "react";
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
    if (currentText === newText) return;
    callback(newText);
  };
  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    setNewText(currentText);
  }, [currentText]);

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
