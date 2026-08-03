import type { MouseEvent } from "react";

import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import CloseIcon from "@mui/icons-material/Close";

import type { ExtendedKind } from "store/dataV2/types";

import type {
  FilterLayer,
  LayerCriterion,
  LayerMode,
} from "@ImageViewer/state/types";

export const catName = (id: string, kinds: ExtendedKind[]): string => {
  for (const s of kinds) for (const c of s.cats) if (c.id === id) return c.name;
  return id;
};
export const kindName = (id: string, kinds: ExtendedKind[]): string =>
  kinds.find((k) => k.id === id)?.name ?? id;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const formatLayerLabel = (
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

const modeChip = {
  keep: { label: "KEEP", palette: "success" as const },
  hide: { label: "HIDE", palette: "warning" as const },
};

interface LayerRowProps {
  layer: FilterLayer;
  kinds: ExtendedKind[];
  remaining: number;
  onToggle: () => void;
  onDelete: () => void;
}

function LayerRow({
  layer,
  kinds,
  remaining,
  onToggle,
  onDelete,
}: LayerRowProps) {
  const chip = modeChip[layer.mode];
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
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Chip
            label={chip.label}
            size="small"
            sx={(theme) => ({
              height: 18,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: ".4px",
              "& .MuiChip-label": { px: 0.75 },
              bgcolor: alpha(theme.palette[chip.palette].main, 0.14),
              color: theme.palette[chip.palette].main,
            })}
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
      <Switch
        size="small"
        checked={layer.enabled}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggle}
      />
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <CloseIcon sx={{ fontSize: 17 }} />
      </IconButton>
    </Box>
  );
}

interface FilterPipelineProps {
  kinds: ExtendedKind[];
  layer: FilterLayer | undefined;
  viewCount: number;
  anySel: boolean;
  mode: LayerMode;
  onMode: (mode: LayerMode) => void;
  onApply: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

/**
 * The single non-destructive filter layer. Applying the current selection
 * creates the layer if none exists, or merges it into the existing one
 * (union of categories/kinds, feature ranges overwritten by key).
 */
export const FilterPipeline = ({
  kinds,
  layer,
  viewCount,
  anySel,
  mode,
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
        py: 1.25,
        height: theme.spacing(17),
      })}
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
          onToggle={onToggle}
          onDelete={onDelete}
        />
      )}

      {/* promote selection → filter */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_: MouseEvent<HTMLElement>, v: LayerMode | null) =>
            v && onMode(v)
          }
          sx={{
            "& .MuiButtonBase-root": {
              py: 0,
            },
          }}
        >
          <ToggleButton
            value="keep"
            sx={{
              px: 1.5,
              py: 0,
              "&.Mui-selected": {
                bgcolor: "success.dark",
                "&:hover": { bgcolor: "success.dark" },
              },
            }}
          >
            Keep
          </ToggleButton>
          <ToggleButton
            value="hide"
            sx={{
              px: 1.5,
              py: 0,
              "&.Mui-selected": {
                bgcolor: "warning.dark",
                "&:hover": { bgcolor: "warning.dark" },
              },
            }}
          >
            Hide
          </ToggleButton>
        </ToggleButtonGroup>
        <Button
          fullWidth
          variant="contained"
          disabled={!anySel}
          color="primary"
          startIcon={<LibraryAddIcon />}
          onClick={onApply}
          size="small"
        >
          {layer ? "Update Filter" : "Create Filter"}
        </Button>
      </Box>
    </Box>
  );
};
