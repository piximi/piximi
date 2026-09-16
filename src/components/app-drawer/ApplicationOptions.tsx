import { Box, Stack, Divider } from "@mui/material";

import { SendFeedbackButton } from "./SendFeedbackButton";
import { HelpButton } from "./HelpButton";
import { SettingsButton } from "./application-settings/SettingsButton";

export const ApplicationOptions = () => {
  return (
    <Box>
      <Divider />
      <Stack
        direction="row"
        justifyContent="space-evenly"
        sx={{ py: 0.5, px: 2 }}
      >
        <SettingsButton />

        <SendFeedbackButton />

        <HelpButton />
      </Stack>
    </Box>
  );
};
