import { useSelector } from "react-redux";

import { Box } from "@mui/material";

import { useClassificationModel } from "hooks";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectModelLifecycleStatus } from "store/classifier/selectors";

import { PredictionListItems } from "../PredictionListItems";
import { ModelActions } from "./ModelActions";
import { ModelSelection } from "./ModelSelection";
import { ModelIO } from "./ModelIO";

export const ClassifierSection = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);

  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  const modelConfig = useClassificationModel();

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%"
        px={1}
        gap={1}
      >
        <ModelIO selectedModelConfig={modelConfig} />
        <ModelSelection selectedModelConfig={modelConfig} />
        <ModelActions />
      </Box>
      {modelStatus === "waiting" && <PredictionListItems />}
    </>
  );
};
