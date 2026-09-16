import { useEffect, useRef, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { FormControl } from "@mui/material";

import { TextFieldWithBlur } from "components/inputs";

import { selectExperiment } from "store/data/selectors";
import { dataSlice } from "store/data";

import { HelpItem } from "data/help/HelpContent";

export const ExperimentNameTextField = () => {
  const dispatch = useDispatch();
  const experiment = useSelector(selectExperiment);
  const [newExperimentName, setNewExperimentName] = useState<string>(
    experiment.name,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextFieldBlur = () => {
    if (newExperimentName === experiment.name) return;
    dispatch(dataSlice.actions.updateExperimentName(newExperimentName));
  };

  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setNewExperimentName(event.target.value);
  };

  useEffect(() => {
    setNewExperimentName(experiment.name);
  }, [experiment.name]);

  return (
    <FormControl>
      <TextFieldWithBlur
        data-help={HelpItem.ExperimentName}
        onChange={handleTextFieldChange}
        onBlur={handleTextFieldBlur}
        value={newExperimentName}
        inputRef={inputRef}
        size="small"
        variant="standard"
        sx={{ "& .MuiInputBase-input": { font: "var(--mui-font-body2)" } }}
        slotProps={{
          htmlInput: { size: newExperimentName.length || 1, min: 0 },
          input: {
            slotProps: {
              input: { size: newExperimentName.length || 1, min: 0 },
            },
          },
        }}
      />
    </FormControl>
  );
};
