import { Fragment, useMemo, useState } from "react";

import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  FormHelperText,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { ChipProps } from "@mui/material";

import type { ModelStatus, SegmentationModelDescriptor } from "core/backend";
import type { ModelDisplayInfo } from "core/dl/segmentation/types";

interface ModelOptionType {
  label: string;
  id: number;
}

type ModelDetails = Omit<ModelDisplayInfo, "name" | "displayName"> & {
  name: string;
  framework: string;
};

const statusChip: Record<
  ModelStatus,
  { label: string; color: ChipProps["color"] }
> = {
  unavailable: { label: "Not built", color: "default" },
  building: { label: "Building", color: "info" },
  ready: { label: "Ready", color: "success" },
  loaded: { label: "Loaded", color: "success" },
  failed: { label: "Failed", color: "error" },
};

/* Where a model is on the way to being usable, and why if it is not. */
const ModelStatusLine = ({ model }: { model: SegmentationModelDescriptor }) => {
  const chip = statusChip[model.status];
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: "center", pb: 1.5, maxWidth: "100%" }}
    >
      <Chip
        size="small"
        variant="outlined"
        color={chip.color}
        label={chip.label}
        icon={
          model.status === "building" ? (
            <CircularProgress size={12} color="inherit" />
          ) : undefined
        }
      />
      {model.statusMessage && (
        <Typography
          variant="caption"
          color={model.status === "failed" ? "error" : "textSecondary"}
          sx={{ overflowWrap: "anywhere" }}
        >
          {model.statusMessage}
        </Typography>
      )}
    </Stack>
  );
};

//github.com/twpkevin06222/Gland-Segmentation/tree/main
export const PretrainedModelSelector = ({
  models,
  setModel,
  error,
  errorText,
  initModel = "-1",
}: {
  models: Array<SegmentationModelDescriptor>;
  setModel: (model: SegmentationModelDescriptor | undefined) => void;
  error?: boolean;
  errorText?: string;
  initModel: string;
}) => {
  const modelSelectOptions: ModelOptionType[] = useMemo(() => {
    return models.map((model, idx) => ({ label: model.name, id: idx }));
  }, [models]);
  const [selectedModel, setSelectedModel] = useState<ModelOptionType | null>(
    modelSelectOptions[+initModel] ?? null,
  );

  const handlePreTrainedModelChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: ModelOptionType | null,
  ) => {
    setSelectedModel(newValue ? modelSelectOptions[newValue.id] : null);
    setModel(newValue ? models[newValue.id] : undefined);
  };

  const modelDetails: ModelDetails | undefined = useMemo(() => {
    if (!selectedModel) return undefined;
    const {
      displayName,
      description,
      use,
      sources,
      cite,
      cloudWarning,
      framework,
      version,
    } = models[selectedModel.id];

    // Every key present is rendered as a row, so leave the optional ones out
    // when a descriptor carries them as undefined.
    return {
      name: displayName,
      framework: version ? `${framework} ${version}` : framework,
      description,
      use,
      sources,
      ...(cite && { cite }),
      ...(cloudWarning && { cloudWarning }),
    };
  }, [models, selectedModel]);

  return (
    <Fragment>
      <Typography gutterBottom sx={{ pb: 2 }}>
        Choose from a provided pre-trained model:
      </Typography>
      <FormControl sx={{ width: "75%", pb: 2 }} size="small" error={error}>
        <Autocomplete
          id="pre-trained-model-select"
          options={modelSelectOptions}
          value={selectedModel}
          onChange={handlePreTrainedModelChange}
          sx={{ width: 300, mx: "auto" }}
          renderInput={(params) => (
            <TextField {...params} label="Pre-trained Models" />
          )}
          blurOnSelect
          openOnFocus
          size="small"
        />

        <FormHelperText sx={{ mx: "auto" }}>{errorText ?? " "}</FormHelperText>
      </FormControl>
      {selectedModel && <ModelStatusLine model={models[selectedModel.id]} />}
      {modelDetails && <PretrainedModelDetails modelDetails={modelDetails} />}
    </Fragment>
  );
};

const PretrainedModelDetails = ({
  modelDetails,
}: {
  modelDetails: ModelDetails;
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
      }}
    >
      {Object.entries(modelDetails).map(([key, value]) => (
        <Fragment key={key}>
          <Typography
            variant="caption"
            color={key === "cloudWarning" ? "warning" : "textSecondary"}
            sx={(theme) =>
              key === "cloudWarning"
                ? {
                    borderBlock: `1px solid ${theme.palette.Alert.warningIconColor}`,
                    mt: 1,
                  }
                : {}
            }
          >
            {key === "cloudWarning"
              ? "Cloud Warning"
              : key[0].toUpperCase() + key.slice(1)}
            :
          </Typography>
          {Array.isArray(value) ? (
            <Typography
              variant="caption"
              color="textSecondary"
              key={key + "-value"}
              sx={{ pl: 1 }}
            >
              {value.map((src, index) => (
                <Fragment key={src.text}>
                  <Link
                    className="source_link"
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {src.text}
                  </Link>
                  {index < value.length - 1 && <span>, </span>}
                </Fragment>
              ))}
            </Typography>
          ) : (
            <Typography
              variant="caption"
              color="textSecondary"
              sx={(theme) =>
                key === "cloudWarning"
                  ? {
                      //bgcolor: theme.palette.Alert.warningStandardBg,
                      borderBlock: `1px solid ${theme.palette.Alert.warningIconColor}`,
                      mt: 1,
                      pl: 1,
                    }
                  : { pl: 1 }
              }
            >
              {value}
            </Typography>
          )}
        </Fragment>
      ))}
    </Box>
  );
};
