import React, { useMemo } from "react";

import { Box, MenuItem, Stack, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ModelIOButtonGroup } from "./ModelIOButtonGroup";
import { ModelExecButtonGroup } from "./ModelExecButtonGroup";
import { ImportTensorflowSegmentationModelDialog } from "./ImportTensorflowModelDialog";

import { HotkeyContext } from "utils/enums";
import { useDispatch, useSelector } from "react-redux";
import { selectSegmenterModel } from "store/segmenter/selectors";
import { useSegmenterStatus } from "views/ProjectViewer/contexts/SegmenterStatusProvider";
import { usePredictSegmenter } from "views/ProjectViewer/hooks/usePredictSegmenter";
import { Model } from "utils/models/Model";
import { Shape } from "store/data/types";
import { segmenterSlice } from "store/segmenter";
import { Segmenter } from "utils/models/segmentation";
import { ModelStatus, ModelTask } from "utils/models/enums";
import { selectProjectImageChannels } from "store/project/selectors";
import { StyledSelect, WithLabel } from "components/inputs";
import { arrayRange } from "utils/arrayUtils";

export const SegmenterSection = () => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectSegmenterModel);
  const projectChannels = useSelector(selectProjectImageChannels);

  const { modelStatus, error, selectedChannel, setSelectedChannel } =
    useSegmenterStatus();
  const predictSegmenter = usePredictSegmenter();
  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: importSegmenterDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleImportModel = async (model: Model, inputShape: Shape) => {
    if (model instanceof Segmenter) {
      if (model.pretrained) {
        await model.loadModel();
      }

      dispatch(
        segmenterSlice.actions.loadUserSelectedModel({
          inputShape,
          model: model as Segmenter,
        }),
      );
    } else if (import.meta.env.NODE_ENV !== "production") {
      console.warn(
        `Attempting to dispatch a model with task ${
          ModelTask[model.task]
        }, should be ${ModelTask[ModelTask.Segmentation]}`,
      );
    }
  };
  const execConfig = useMemo(() => {
    let predictText: string;

    switch (modelStatus) {
      case ModelStatus.Idle:
        predictText = error
          ? error.message
          : selectedModel
            ? "Predict Model"
            : "No Trained Model";
        break;
      case ModelStatus.Predicting:
        predictText = "...Predicting";
        break;
      default:
        predictText = "...Pending";
    }
    const fitText = "Model is inference only";
    const evaluateText = "Model is inference only";
    return {
      fit: {
        helperText: fitText,
        disabled: true,
      },
      predict: { helperText: predictText, disabled: !selectedModel || !!error },
      evaluate: {
        helperText: evaluateText,
        disabled: true,
      },
    };
  }, [modelStatus, selectedModel, error]);

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
        width="100%"
        px={1}
      >
        <ModelIOButtonGroup
          hasTrainedModel={false}
          handleImportModel={onOpenImportSegmenterDialog}
          handleSaveModel={() => {}}
        />

        <Stack
          width="100%"
          py={0.5}
          borderTop={"1px solid white"}
          borderBottom={"1px solid white"}
          sx={(theme) => ({
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Typography variant="caption" noWrap>
            {`Selected Model:  ${selectedModel ? selectedModel.name : "No Selected Model"}`}
          </Typography>
          <Typography variant="caption" noWrap>
            {`Model Kind:  ${selectedModel?.kind ?? "N/A"}`}
          </Typography>
          <WithLabel
            label="Channel:"
            labelProps={{
              variant: "body2",
              sx: {
                mr: "0.5rem",
                whiteSpace: "nowrap",
              },
            }}
            sx={{ maxWidth: "calc(100% - 23px)" }}
          >
            <StyledSelect
              value={selectedChannel}
              onChange={(event) => {
                const value = event.target.value as number;

                setSelectedChannel(value);
              }}
              fullWidth
              variant="standard"
              disabled={projectChannels === 1}
            >
              <MenuItem
                dense
                value={-1}
                sx={{
                  borderRadius: 0,
                  minHeight: "1rem",
                }}
              >
                --
              </MenuItem>
              {projectChannels &&
                arrayRange(projectChannels).map((channel) => (
                  <MenuItem
                    key={`channel-${channel}`}
                    dense
                    value={channel}
                    sx={{
                      borderRadius: 0,
                      minHeight: "1rem",
                    }}
                  >
                    {channel + 1}
                  </MenuItem>
                ))}
            </StyledSelect>
          </WithLabel>
        </Stack>

        <ModelExecButtonGroup
          modelStatus={modelStatus}
          handleEvaluate={() => {}}
          handleFit={() => {}}
          handlePredict={predictSegmenter}
          execConfig={execConfig}
        />
      </Box>

      <ImportTensorflowSegmentationModelDialog
        loadedModel={
          selectedModel?.name === "Fully Convolutional Network"
            ? undefined
            : selectedModel
        }
        onClose={onCloseImportSegmenterDialog}
        open={importSegmenterDialogOpen}
        dispatchFunction={handleImportModel}
      />
    </>
  );
};
