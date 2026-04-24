import type React from "react";
import { useState } from "react";

import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { ClassifierStatusProvider } from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { ClassifierHistoryProvider } from "@ProjectViewer/contexts/ClassifierHistoryProvider";
import { ClassMapDialogProvider } from "@ProjectViewer/contexts/class-map";
import { SegmenterStatusProvider } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import { SegmenterSection } from "./SegmenterSection";
import { ClassifierSection } from "./ClassifierSection";

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
        size="small"
        color="primary"
        exclusive
        onChange={handleToggleLearningTask}
        sx={{ width: "95%" }}
      >
        <ToggleButton value="Classification" sx={{ width: "50%" }}>
          Classification
        </ToggleButton>
        <ToggleButton value="Segmentation" sx={{ width: "50%" }}>
          Segmentation
        </ToggleButton>
      </ToggleButtonGroup>
      {learningTask === "Classification" ? (
        <ClassifierStatusProvider>
          <ClassifierHistoryProvider>
            <ClassMapDialogProvider>
              <ClassifierSection />
            </ClassMapDialogProvider>
          </ClassifierHistoryProvider>
        </ClassifierStatusProvider>
      ) : (
        <SegmenterStatusProvider>
          <SegmenterSection />
        </SegmenterStatusProvider>
      )}
    </Box>
  );
};
