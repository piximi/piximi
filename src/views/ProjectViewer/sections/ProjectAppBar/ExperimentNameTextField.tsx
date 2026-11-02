import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { FormControl } from "@mui/material";

import { TextFieldWithBlur } from "components/inputs";

import { selectExperiment } from "store/data/selectors";
import { dataSlice } from "store/data";
import { HelpItem } from "help/HelpContent";

export const ExperimentNameTextField = () => {
  const dispatch = useDispatch();
  const experiment = useSelector(selectExperiment);

  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? experiment.name;
  const handleTextFieldBlur = () => {
    if (draft !== null && draft !== experiment.name)
      dispatch(dataSlice.actions.updateExperimentName(draft));
    setDraft(null);
  };

  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDraft(event.target.value);
  };

  return (
    <FormControl>
      <TextFieldWithBlur
        data-help={HelpItem.ExperimentName}
        onChange={handleTextFieldChange}
        onBlur={handleTextFieldBlur}
        value={name}
        size="small"
        variant="standard"
        sx={{ "& .MuiInputBase-input": { font: "var(--mui-font-body2)" } }}
        slotProps={{
          htmlInput: { size: name.length || 1, min: 0 },
          input: {
            slotProps: {
              input: { size: name.length || 1, min: 0 },
            },
          },
        }}
      />
    </FormControl>
  );
};
