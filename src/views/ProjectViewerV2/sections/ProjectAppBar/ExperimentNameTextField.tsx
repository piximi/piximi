import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FormControl } from "@mui/material";

import { TextFieldWithBlur } from "components/inputs";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { selectExperiment } from "store/dataV2/selectors";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";

export const ExperimentNameTextField = () => {
  const dispatch = useDispatch();
  const experiment = useSelector(selectExperiment);
  const [newExperimentName, setNewExperimentName] = useState<string>(
    experiment.name,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextFieldBlur = () => {
    if (newExperimentName === experiment.name) return;
    dispatch(dataSliceV2.actions.updateExperimentName(newExperimentName));
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
        sx={{ ml: 5 }}
        variant="standard"
        slotProps={{
          htmlInput: { min: 0 },
          input: {
            slotProps: {
              input: { min: 0 },
            },
          },
        }}
      />
    </FormControl>
  );
};
