import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ClassifierListNew } from "components/lists/ClassifierList/ClassifierListNew";
import { SegmenterListNew } from "components/lists/SegmenterList/SegmenterListNew";
import React, { useState } from "react";

export const ModelTaskSection = () => {
  const [learningTask, setLearningTask] = useState<
    "Classification" | "Segmentation"
  >("Classification");

  const handleToggleLearningTask = (
    event: React.MouseEvent<HTMLElement>,
    newLearningTask: "Classification" | "Segmentation" | null
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
        <ClassifierListNew />
      ) : (
        <SegmenterListNew />
      )}
    </Box>
  );
};