import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FormControl, Typography } from "@mui/material";

import { TextFieldWithBlur } from "components/inputs";

import { selectLoadMessage } from "store/applicationSettings/selectors";
import { projectSlice } from "store/project";
import { selectProjectName } from "store/project/selectors";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const ProjectTextField = () => {
  const dispatch = useDispatch();

  const loadMessage = useSelector(selectLoadMessage);
  const projectName = useSelector(selectProjectName);
  const [newProjectName, setNewProjectName] = useState<string>(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextFieldBlur = () => {
    if (projectName === newProjectName) return;
    dispatch(projectSlice.actions.setProjectName({ name: newProjectName }));
    setNewProjectName("");
  };

  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setNewProjectName(event.target.value);
  };

  useEffect(() => {
    setNewProjectName(projectName);
  }, [projectName]);

  return (
    <>
      {loadMessage ? (
        <Typography ml={5} sx={{ flexGrow: 1 }}>
          {loadMessage}
        </Typography>
      ) : (
        <FormControl>
          <TextFieldWithBlur
            data-help={HelpItem.ProjectName}
            onChange={handleTextFieldChange}
            onBlur={handleTextFieldBlur}
            value={newProjectName}
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
      )}
    </>
  );
};
