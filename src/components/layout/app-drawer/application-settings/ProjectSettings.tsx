import { useDispatch, useSelector } from "react-redux";

import { Box, Stack, Typography } from "@mui/material";

import { DividerHeader } from "components/ui";
import { CustomSwitch } from "components/inputs";

import { applicationSettingsSlice } from "store/applicationSettings";
import {
  selectShowClearPredictionsWarning,
  selectShowSaveProjectDialog,
} from "store/applicationSettings/selectors";

import { SettingsItem } from "./SettingsItem";

export const ProjectSettings = () => {
  const dispatch = useDispatch();
  const showSaveProjectDialog = useSelector(selectShowSaveProjectDialog);
  const showClearPredictionsWarning = useSelector(
    selectShowClearPredictionsWarning,
  );
  const handleToggleSaveDialog = () => {
    dispatch(
      applicationSettingsSlice.actions.setShowSaveProjectDialog({
        show: !showSaveProjectDialog,
      }),
    );
  };
  const handleToggleShowPredictions = () => {
    dispatch(
      applicationSettingsSlice.actions.setShowClearPredictionsWarning(
        !showSaveProjectDialog,
      ),
    );
  };
  return (
    <Box>
      <DividerHeader
        typographyVariant="body1"
        textAlign="left"
        sx={(theme) => ({ color: theme.palette.grey[500] })}
      >
        Project
      </DividerHeader>
      <Stack
        spacing={1}
        sx={{
          px: 2,
          ".MuiGrid-root:first-of-type": { marginLeft: "0px" },
        }}
      >
        <SettingsItem
          title={
            <Box display="flex">
              <Typography>{"Prompt save when starting new project"}</Typography>
            </Box>
          }
        >
          <CustomSwitch
            checked={showSaveProjectDialog}
            onChange={handleToggleSaveDialog}
            height={24}
            width={42}
          />
        </SettingsItem>
        <SettingsItem
          title={
            <Box display="flex">
              <Typography>
                {"Prompt save predictions when training model"}
              </Typography>
            </Box>
          }
        >
          <CustomSwitch
            checked={showClearPredictionsWarning}
            onChange={handleToggleShowPredictions}
            height={24}
            width={42}
          />
        </SettingsItem>
      </Stack>
    </Box>
  );
};
