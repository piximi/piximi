import { Stack, Typography } from "@mui/material";
import React from "react";
import { ClearAnnotationsGroup } from "./ClearAnnotationsGroup";
import { AnnotationLinkingSection } from "./AnnotationLinkingSection";

export const AnnotationSection = () => {
  return (
    <Stack>
      <Typography
        sx={(theme) => ({
          width: "90%",
          textAlign: "center",
          mx: "auto",
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        Annotations
      </Typography>
      <ClearAnnotationsGroup />
      <AnnotationLinkingSection />
    </Stack>
  );
};
