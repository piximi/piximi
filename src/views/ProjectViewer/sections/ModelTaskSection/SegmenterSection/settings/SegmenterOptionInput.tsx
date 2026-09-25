import { Fragment, useEffect, useMemo, useState } from "react";

import {
  Box,
  MenuItem,
  Slider,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";

import { StyledSelect, TextFieldWithBlur } from "components/inputs";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import type { SegmenterOptionField } from "core/dl/segmentation/types";

const LABEL_SX = { flexShrink: 0, mr: 1, whiteSpace: "nowrap" } as const;

/*
 * `grid` emits the label, an arrow and the control as three bare siblings so a
 * parent grid can column-align them with the channel-mapping rows — which also
 * makes every control in that grid exactly the same width.
 */
export type SegmenterOptionLayout = "row" | "grid";

const Row = ({
  label,
  help,
  layout,
  children,
}: {
  label: string;
  help?: string;
  layout: SegmenterOptionLayout;
  children: React.ReactNode;
}) => {
  const labelNode = (
    <Tooltip
      title={help ?? ""}
      placement="top-start"
      disableHoverListener={!help}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={layout === "grid" ? undefined : LABEL_SX}
      >
        {label}
      </Typography>
    </Tooltip>
  );

  return layout === "grid" ? (
    <Fragment>
      {labelNode}
      <ArrowRightAltIcon
        sx={{ fontSize: 16, color: "text.disabled", opacity: 0.6 }}
      />
      {children}
    </Fragment>
  ) : (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1,
        py: 0.25,
      }}
    >
      {labelNode}
      <Box
        sx={{
          minWidth: 0,
          flex: "1 1 auto",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

/*
 * Renders one declarative option field. The schema is plain data (it crosses the
 * Comlink boundary), so everything that needs live context — the channel list
 * behind a `channelIndex` field, the current values behind `visibleWhen` — is
 * resolved here rather than baked into the schema.
 */
export const SegmenterOptionInput = ({
  field,
  layout = "row",
}: {
  field: SegmenterOptionField;
  layout?: SegmenterOptionLayout;
}) => {
  const theme = useTheme();
  const {
    optionValues,
    setOptionValue,
    channelSelection,
    channelMetas,
    loadedModel,
  } = useSegmenterStatus();

  const value = optionValues[field.key];

  /* Numbers are edited as text so an in-progress "-" or "0." isn't clobbered. */
  const [draft, setDraft] = useState<string>(
    value === undefined ? "" : String(value),
  );
  useEffect(() => {
    setDraft(value === undefined ? "" : String(value));
  }, [value]);

  /* The channels actually being sent, in the order the model will see them. */
  const sentChannels = useMemo(() => {
    const all = Object.values(channelMetas);
    if (channelSelection.mode === "explicit") {
      return channelSelection.channelIds.map(
        (id, idx) => channelMetas[id]?.name ?? `Channel ${idx + 1}`,
      );
    }
    const policy = loadedModel?.channelPolicy;
    const cap =
      policy?.mode === "passthrough" && optionValues.channelMode !== "legacy"
        ? policy.maxChannels
        : all.length;
    return all.slice(0, cap).map((channel) => channel.name);
  }, [channelSelection, channelMetas, loadedModel, optionValues.channelMode]);

  /*
   * A slot index left over from a longer channel list would point past the end,
   * so fall back to 0 ("grayscale"/"none") until the user picks again.
   */
  useEffect(() => {
    if (field.type !== "channelIndex") return;
    if (typeof value === "number" && value > sentChannels.length) {
      setOptionValue(field.key, 0);
    }
  }, [field, value, sentChannels.length, setOptionValue]);

  const handleTextFieldBlur = () => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      // Empty is only meaningful for an optional field, where it means
      // "omit the key and let the library default apply".
      if (field.type === "number" && field.optional) {
        setOptionValue(field.key, undefined);
      } else {
        setDraft(value === undefined ? "" : String(value));
      }
      return;
    }
    const parsed = Number(trimmed);
    if (field.type !== "number" || !Number.isFinite(parsed)) {
      setDraft(value === undefined ? "" : String(value));
      return;
    }
    const clamped = Math.min(
      field.max ?? Number.POSITIVE_INFINITY,
      Math.max(field.min ?? Number.NEGATIVE_INFINITY, parsed),
    );
    setOptionValue(field.key, clamped);
    setDraft(String(clamped));
  };

  switch (field.type) {
    case "boolean":
      return (
        <Row label={field.label} help={field.help} layout={layout}>
          <Switch
            size="small"
            checked={value === true}
            onChange={(event) =>
              setOptionValue(field.key, event.target.checked)
            }
          />
        </Row>
      );

    case "select":
      return (
        <Row label={field.label} help={field.help} layout={layout}>
          <StyledSelect
            value={typeof value === "string" ? value : field.default}
            onChange={(event) =>
              setOptionValue(field.key, event.target.value as string)
            }
            fontSize={theme.typography.caption.fontSize}
            fullWidth
          >
            {field.choices.map((choice) => (
              <MenuItem
                key={choice.value}
                dense
                value={choice.value}
                sx={{ borderRadius: 0, minHeight: "1rem" }}
              >
                {choice.label}
              </MenuItem>
            ))}
          </StyledSelect>
        </Row>
      );

    case "channelIndex":
      return (
        <Row label={field.label} help={field.help} layout={layout}>
          <StyledSelect
            value={typeof value === "number" ? value : field.default}
            onChange={(event) =>
              setOptionValue(field.key, Number(event.target.value))
            }
            fontSize={theme.typography.caption.fontSize}
            fullWidth
          >
            <MenuItem
              dense
              value={0}
              sx={{ borderRadius: 0, minHeight: "1rem" }}
            >
              {field.zeroLabel}
            </MenuItem>
            {sentChannels.map((name, idx) => (
              <MenuItem
                key={`${idx}-${name}`}
                dense
                value={idx + 1}
                sx={{ borderRadius: 0, minHeight: "1rem" }}
              >
                {`Slot ${idx + 1} — ${name}`}
              </MenuItem>
            ))}
          </StyledSelect>
        </Row>
      );

    case "number":
      if (field.control === "slider") {
        const current =
          typeof value === "number" ? value : (field.default ?? 0);
        return (
          <Row label={field.label} help={field.help} layout={layout}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              <Slider
                size="small"
                value={current}
                min={field.min}
                max={field.max}
                step={field.step}
                onChange={(_event, next) =>
                  setOptionValue(field.key, next as number)
                }
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ minWidth: "2.5rem", textAlign: "right" }}
              >
                {current.toFixed(field.precision ?? 0)}
              </Typography>
            </Box>
          </Row>
        );
      }
      return (
        <Row label={field.label} help={field.help} layout={layout}>
          <TextFieldWithBlur
            onChange={(event) => setDraft(event.target.value)}
            onBlur={handleTextFieldBlur}
            placeholder={field.emptyLabel}
            value={draft}
            size="small"
            variant="standard"
            sx={{
              maxWidth: "6rem",
            }}
            slotProps={{
              htmlInput: {
                inputMode: "decimal",
                style: { textAlign: "right", fontSize: 12 },
              },
            }}
          />
        </Row>
      );
  }
};
