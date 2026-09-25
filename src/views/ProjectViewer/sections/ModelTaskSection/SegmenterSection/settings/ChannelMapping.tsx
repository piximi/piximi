import { Fragment, useMemo } from "react";

import {
  Box,
  Divider,
  IconButton,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import CloseIcon from "@mui/icons-material/Close";

import {
  CHANNEL_MODE_KEY,
  CHANNEL_MODE_LEGACY,
  isFieldVisible,
} from "core/dl/segmentation/optionUtils";

import { StyledSelect } from "components/inputs";

import { arrayRange } from "utils/arrayUtils";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import { SegmenterOptionInput } from "./SegmenterOptionInput";

import type { SelectChangeEvent } from "@mui/material";

import type { ChannelMeta } from "core/entities";

const SELECT_PLACEHOLDER = "Select Channel";

const HEADER_SX = {
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.675rem",
  lineHeight: 1.6,
} as const;

/*
 * The single place a segmenter's channel inputs are configured.
 *
 * `fixed` models (Stardist, GlaS, COCO-SSD) need exactly one image channel per
 * model input, so they get the mapping grid. `passthrough` models (Cellpose-SAM)
 * are channel-agnostic and take the source channels as-is, so forcing a mapping
 * there would pad a 1-channel image into three copies of itself.
 *
 * A passthrough model may also declare a channel-mode field (see
 * `CHANNEL_MODE_KEY`) offering its own explicit selection. That selection
 * supersedes this component's picker rather than stacking with it — otherwise
 * the user would subset the channels here and then subset them again there.
 */
export const ChannelMapping = () => {
  const theme = useTheme();

  const {
    loadedModel,
    channelMetas,
    channelSelection,
    setChannelSelection,
    optionValues,
  } = useSegmenterStatus();

  const availableChannels = useMemo(
    () => Object.values(channelMetas),
    [channelMetas],
  );

  const modelSelectsOwnChannels =
    optionValues[CHANNEL_MODE_KEY] === CHANNEL_MODE_LEGACY;

  const renderChannelName = (value: unknown) =>
    value === "" || value === undefined
      ? SELECT_PLACEHOLDER
      : (channelMetas[value as string]?.name ?? SELECT_PLACEHOLDER);

  const channelItems = availableChannels.map((channel: ChannelMeta) => (
    <MenuItem
      key={channel.id}
      dense
      value={channel.id}
      sx={{ borderRadius: 0, minHeight: "1rem" }}
    >
      {channel.name}
    </MenuItem>
  ));

  const setSlot = (event: SelectChangeEvent<unknown>, slotIndex: number) => {
    const channelId = event.target.value as string;
    setChannelSelection((selection) => {
      const current = selection.mode === "explicit" ? selection.channelIds : [];
      if (current[slotIndex] === channelId) return selection;
      const channelIds = [...current];
      channelIds[slotIndex] = channelId;
      return { mode: "explicit", channelIds };
    });
  };

  if (!loadedModel || availableChannels.length === 0) return null;

  const policy = loadedModel.channelPolicy;

  /* Option fields the model wants shown here rather than in the options panel. */
  const channelFields = (loadedModel.optionSchema?.groups ?? [])
    .filter((group) => group.describesChannels)
    .flatMap((group) => group.fields)
    .filter((field) => isFieldVisible(field, optionValues));

  const modeField = channelFields.find(
    (field) => field.key === CHANNEL_MODE_KEY,
  );
  const selectionFields = channelFields.filter(
    (field) => field.key !== CHANNEL_MODE_KEY,
  );

  const slotCap =
    policy.mode === "fixed"
      ? policy.count
      : Math.min(policy.maxChannels, availableChannels.length);

  const explicitIds =
    channelSelection.mode === "explicit" ? channelSelection.channelIds : [];

  const showGrid =
    policy.mode === "fixed" || channelSelection.mode === "explicit";

  return (
    <Box sx={{ pb: 1.75 }}>
      <Divider sx={{ mb: 0.75 }}>
        <Typography variant="caption" color="text.disabled">
          Channel Mapping
        </Typography>
      </Divider>

      {modeField && <SegmenterOptionInput field={modeField} />}

      {showGrid && !modelSelectsOwnChannels && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              policy.mode === "fixed"
                ? "max-content 16px 1fr"
                : "max-content 16px 1fr max-content",
            alignItems: "center",
            columnGap: 1.25,
            rowGap: 0.5,
            mt: 1,
            px: 1,
          }}
        >
          <Typography variant="caption" color="text.disabled" sx={HEADER_SX}>
            {policy.mode === "fixed" ? "Model Input" : "Slot"}
          </Typography>
          <Box />
          <Typography variant="caption" color="text.disabled" sx={HEADER_SX}>
            Image Source
          </Typography>
          {policy.mode === "passthrough" && <Box />}
          <Divider sx={{ gridColumn: "1 / -1", mb: 1 }} />

          {arrayRange(
            policy.mode === "fixed" ? policy.count : explicitIds.length,
          ).map((idx) => (
            <Fragment key={idx}>
              <Typography variant="caption" color="text.secondary">
                {policy.mode === "fixed"
                  ? `Channel ${idx + 1}`
                  : `Slot ${idx + 1}`}
              </Typography>

              <ArrowRightAltIcon
                sx={{ fontSize: 16, color: "text.disabled", opacity: 0.6 }}
              />

              <StyledSelect
                value={explicitIds[idx] ?? ""}
                onChange={(event) => setSlot(event, idx)}
                fontSize={theme.typography.caption.fontSize}
                displayEmpty={true}
                renderValue={renderChannelName}
              >
                {channelItems}
              </StyledSelect>

              {policy.mode === "passthrough" && (
                <IconButton
                  size="small"
                  aria-label={`Remove slot ${idx + 1}`}
                  disabled={explicitIds.length <= 1}
                  onClick={() =>
                    setChannelSelection({
                      mode: "explicit",
                      channelIds: explicitIds.filter((_, i) => i !== idx),
                    })
                  }
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Fragment>
          ))}

          {policy.mode === "passthrough" && explicitIds.length < slotCap && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  setChannelSelection({
                    mode: "explicit",
                    channelIds: [
                      ...explicitIds,
                      availableChannels[
                        Math.min(
                          explicitIds.length,
                          availableChannels.length - 1,
                        )
                      ].id,
                    ],
                  })
                }
              >
                + Add channel
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {selectionFields.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "max-content 16px 1fr",
            alignItems: "center",
            columnGap: 1.25,
            rowGap: 0.5,
            mt: 1,
            px: 1,
          }}
        >
          <Typography variant="caption" color="text.disabled" sx={HEADER_SX}>
            Model Input
          </Typography>
          <Box />
          <Typography variant="caption" color="text.disabled" sx={HEADER_SX}>
            Image Source
          </Typography>
          <Divider sx={{ gridColumn: "1 / -1" }} />

          {selectionFields.map((field) => (
            <SegmenterOptionInput
              key={`${field.key}`}
              field={field}
              layout="grid"
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
