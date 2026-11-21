import { useState } from "react";

import { useSelector } from "react-redux";

import { FormControl } from "@mui/material";

import { useBackend } from "core/backend";

import { TextFieldWithBlur } from "components/inputs";

import { selectExperiment } from "store/data/selectors";
import { HelpItem } from "help/HelpContent";

export const ExperimentNameTextField = () => {
  const backend = useBackend();
  const experiment = useSelector(selectExperiment);

  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? experiment.name;
  // The project name is the backend's; the store follows its announcement.
  const handleTextFieldBlur = () => {
    if (draft !== null && draft.trim() && draft !== experiment.name) {
      backend.project
        .rename(draft)
        .catch((error: unknown) =>
          console.error("[ExperimentNameTextField] rename", error),
        );
    }
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
