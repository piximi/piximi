import React from "react";
import { ClassifierSettingsDialogTabContext } from "../ClassifierSettingsDialogTabContext";
import { Container, DialogContent } from "@mui/material";

export const ClassifierSettingsDialogContent = () => {
  return (
    <DialogContent sx={{ marginTop: (theme) => theme.spacing(8) }}>
      <Container
        sx={{
          paddingBottom: (theme) => theme.spacing(8),
          paddingTop: (theme) => theme.spacing(8),
        }}
        maxWidth="md"
      >
        <ClassifierSettingsDialogTabContext />
      </Container>
    </DialogContent>
  );
};
