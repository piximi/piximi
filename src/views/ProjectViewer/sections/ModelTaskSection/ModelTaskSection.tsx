import { useState } from "react";

import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { HelpItem } from "help/HelpContent";

import { ClassifierStatusProvider } from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { ClassifierHistoryProvider } from "@ProjectViewer/contexts/ClassifierHistoryProvider";
import { ClassMapDialogProvider } from "@ProjectViewer/contexts/class-map";

import { SegmenterSection } from "./SegmenterSection";
import { ClassifierSection } from "./ClassifierSection";

import type React from "react";

export const ModelTaskSection = () => {
  const [learningTask, setLearningTask] = useState<
    "Classification" | "Segmentation"
  >("Classification");

  const handleToggleLearningTask = (
    event: React.MouseEvent<HTMLElement>,
    newLearningTask: "Classification" | "Segmentation" | null,
  ) => {
    if (newLearningTask !== null) {
      setLearningTask(newLearningTask);
    }
  };
  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
    >
      <ToggleButtonGroup
        data-help={HelpItem.LearningTask}
        value={learningTask}
        color="primary"
        exclusive
        onChange={handleToggleLearningTask}
        size="small"
        sx={{
          width: "95%",
          height: 25,
          "& .MuiButtonBase-root": {
            px: 0,
            py: 0.5,
            fontSize: "0.75rem",
            lineHeight: 1,
          },
        }}
      >
        <ToggleButton value="Classification" sx={{ width: "50%" }}>
          Classification
        </ToggleButton>
        <ToggleButton value="Segmentation" sx={{ width: "50%" }}>
          Segmentation
        </ToggleButton>
      </ToggleButtonGroup>
      <ClassifierStatusProvider>
        <ClassifierHistoryProvider>
          <ClassMapDialogProvider>
            {learningTask === "Classification" ? (
              <ClassifierSection />
            ) : (
              <SegmenterSection />
            )}
          </ClassMapDialogProvider>
        </ClassifierHistoryProvider>
      </ClassifierStatusProvider>
    </Box>
  );
};
