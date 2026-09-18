import { useSelector } from "react-redux";

import { Box, Divider } from "@mui/material";

import { useParameterizedSelector } from "store/hooks";
import { selectModelLifecycleStatus } from "store/classifier/selectors";

import { useClassificationModel } from "@ProjectViewer/hooks";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import { PredictionListItems } from "../PredictionListItems";
import { ModelActions } from "./ModelActions";
import { ModelSelection } from "./ModelSelection";

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
        <ModelSelection selectedModelConfig={modelConfig} />
        <Divider flexItem />
        <ModelActions />
      </Box>
      {modelStatus === "waiting" && <PredictionListItems />}
    </>
  );
};
