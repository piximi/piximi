import {
  alpha,
  Box,
  Button,
  IconButton,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import CloseIcon from "@mui/icons-material/Close";

import { HelpItem } from "help/HelpContent";

import type { MouseEvent } from "react";

import type { ExtendedKind } from "core/entities";

import type {
  FilterLayer,
  LayerCriterion,
  LayerMode,
} from "@ImageViewer/state/types";

const catName = (id: string, kinds: ExtendedKind[]): string => {
  for (const s of kinds) for (const c of s.cats) if (c.id === id) return c.name;
  return id;
};
const kindName = (id: string, kinds: ExtendedKind[]): string =>
  kinds.find((k) => k.id === id)?.name ?? id;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const formatLayerLabel = (
  layer: LayerCriterion,
  kinds: ExtendedKind[],
): string => {
  const parts: string[] = [];
  (layer.kindIds || []).forEach((id) => parts.push(kindName(id, kinds)));
  (layer.catIds || []).forEach((id) => parts.push(catName(id, kinds)));
  (layer.features || []).forEach((f) =>
    parts.push(`${cap(f.feature)} ${f.min}–${f.max}`),
  );
  // Hand-picked annotations must show up here: a layer built from a click-only
  // selection has no category or feature parts, and labelling it "any" would
  // read as "matches everything" — the opposite of what it does.
  const picked = layer.includeIds?.length ?? 0;
  if (picked) parts.push(`${picked} picked`);
  const omitted = layer.excludeIds?.length ?? 0;
  if (omitted) parts.push(`−${omitted}`);
  if (!parts.length) return "any";
  return (
    parts.slice(0, 2).join(", ") +
    (parts.length > 2 ? ` +${parts.length - 2}` : "")
  );
};

interface LayerRowProps {
  layer: FilterLayer;
  kinds: ExtendedKind[];
  remaining: number;
  onMode: (mode: LayerMode) => void;
  onToggle: () => void;
  onDelete: () => void;
}

const ROW_BOX_STYLE = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: "100%",
  gap: 1,
};

function LayerRow({
  layer,
  kinds,
  remaining,
  onMode,
  onToggle,
  onDelete,
}: LayerRowProps) {
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        minHeight: 44,
        px: 1,
        py: 0.5,
        borderRadius: 1.25,
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        border: `1px solid ${theme.palette.primary.main}`,
        opacity: layer.enabled ? 1 : 0.7,
      })}
    >
      <Box sx={ROW_BOX_STYLE}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Switch
            size="x-small"
            checked={layer.enabled}
            onClick={(e) => e.stopPropagation()}
            onChange={onToggle}
          />
          <Typography
            noWrap
            sx={{
              fontSize: 13,
              color: layer.enabled ? "text.primary" : "text.disabled",
            }}
          >
            {formatLayerLabel(layer, kinds)}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: 10.5,
            fontFamily: "ui-monospace,monospace",
            color: "primary.main",
            fontWeight: 600,
            pl: 1,
          }}
        >
          {`→ ${remaining} in view`}
        </Typography>
      </Box>
      <Box sx={{ ...ROW_BOX_STYLE, alignItems: "flex-end" }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{ p: 0 }}
        >
          <CloseIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={layer.mode}
          onChange={(e: MouseEvent<HTMLElement>, v: LayerMode | null) => {
            e.stopPropagation();
            if (v) onMode(v);
          }}
          sx={{
            height: 20,
            "& .MuiButtonBase-root": {
              px: 1,
              py: 0,
              fontSize: "0.65rem",
              lineHeight: 1,
            },
          }}
        >
          <ToggleButton
            value="keep"
            sx={(theme) => ({
              "&.Mui-selected": {
                bgcolor: alpha(theme.palette.success.main, 0.24),
                color: theme.palette.success.main,
                "&:hover": {
                  bgcolor: alpha(theme.palette.success.dark, 0.24),
                },
              },
            })}
          >
            Keep
          </ToggleButton>
          <ToggleButton
            value="hide"
            sx={(theme) => ({
              "&.Mui-selected": {
                bgcolor: alpha(theme.palette.warning.main, 0.24),
                color: theme.palette.warning.main,
                "&:hover": {
                  bgcolor: alpha(theme.palette.warning.dark, 0.24),
                },
              },
            })}
          >
            Hide
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}

interface FilterPipelineProps {
  kinds: ExtendedKind[];
  layer: FilterLayer | undefined;
  viewCount: number;
  anySel: boolean;
  onMode: (mode: LayerMode) => void;
  onApply: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

/**
 * The single non-destructive filter layer. Applying the current selection
 * creates the layer if none exists, or merges it into the existing one
 * (union of categories/kinds, feature ranges overwritten by key).
 *
 * A new layer is always created as `keep`; whether it keeps or hides is a
 * property of the layer, flipped on its own row once it exists.
 */
export const FilterPipeline = ({
  kinds,
  layer,
  viewCount,
  anySel,
  onMode,
  onApply,
  onToggle,
  onDelete,
}: FilterPipelineProps) => {
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        bgcolor:
          "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-selectedOpacity))",
        borderTop: 1,
        borderBottom: 1,
        borderColor: "divider",
        px: 1.5,
        py: 1,
        minHeight: theme.spacing(17),
      })}
      data-help={HelpItem.AnnotationFilterSection}
    >
      {/*Title*/}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 0.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <FilterAltIcon sx={{ fontSize: 17, color: "primary.main" }} />
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".6px",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Filters
          </Typography>
        </Box>
      </Box>

      {!layer && (
        <Typography
          sx={{
            textAlign: "center",
            fontSize: 11.5,
            color: "text.disabled",
          }}
        >
          Select options below, then{" "}
          <b style={{ color: "var(--mui-palette-text-primary)" }}>
            Create filter
          </b>{" "}
          to start filtering.
        </Typography>
      )}
      {layer && (
        <LayerRow
          layer={layer}
          kinds={kinds}
          remaining={viewCount}
          onMode={onMode}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      )}

      {/* promote selection → filter */}
      <Button
        fullWidth
        variant="contained"
        disabled={!anySel}
        color="primary"
        startIcon={<LibraryAddIcon />}
        onClick={onApply}
        size="small"
        sx={{
          fontSize: "0.75rem",
          height: 28,
        }}
      >
        {layer ? "Update Filter" : "Create Filter"}
      </Button>
    </Box>
  );
};
