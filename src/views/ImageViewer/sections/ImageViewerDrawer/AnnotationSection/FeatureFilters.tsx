import { useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { Box, Collapse, Slider, Switch, Typography } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { ExpandIcon } from "components/ui";

import { HelpItem } from "help/HelpContent";

import {
  selectGlobalFeatureBounds,
  selectInViewFeatureBounds,
} from "views/ImageViewer/state/image-viewer-data/reselectors";
import { resolveRange } from "views/ImageViewer/state/image-viewer-data/utils";

import { useCriterionToggles } from "./useCriterionToggles";

import type { ObjectFeature } from "core/entities";

import type {
  FeatureConfig,
  FeatureRangeState,
  FeatureState,
} from "@ImageViewer/state/types";

interface FeatureFiltersProps {
  feats: FeatureState;
}

interface FeatureRowProps {
  cfg: FeatureConfig;
  localBounds: [number, number];
  f: FeatureRangeState;
  onToggle: () => void;
  onCommit: (range: [number, number]) => void;
}

// Local drag state so a slider drag only dispatches (and re-runs the filter
// pipeline) once, on release, instead of on every intermediate drag frame.
function FeatureRow({
  cfg,
  localBounds,
  f,
  onToggle,
  onCommit,
}: FeatureRowProps) {
  const [lo, hi] = resolveRange(f, cfg.bounds);
  const [live, setLive] = useState<[number, number]>([lo, hi]);
  const [showSlider, setShowSlider] = useState(f.active);

  const marks = useMemo(
    () => [{ value: localBounds[0] }, { value: localBounds[1] }],
    [localBounds],
  );
  useEffect(() => {
    setLive([lo, hi]);
  }, [lo, hi]);

  return (
    <Box
      sx={{
        mb: 0.5,
        cursor: "pointer",
        borderRadius: "var(--mui-shape-borderRadius)",
        "&:hover": { bgcolor: "var(--mui-palette-action-hover)" },
      }}
      onClick={() => setShowSlider((v) => !v)}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Switch
          size="small"
          checked={f.active}
          onClick={(e) => e.stopPropagation()}
          onChange={onToggle}
        />
        <Typography
          noWrap
          sx={{
            flex: 1,
            fontSize: "0.75rem",
            color: f.active ? "text.primary" : "text.secondary",
          }}
        >
          {cfg.label}
          {cfg.unit ? ` (${cfg.unit})` : ""}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontFamily: "ui-monospace,monospace",
            color: f.active ? "primary.main" : "text.disabled",
          }}
        >
          {live[0]}–{live[1]}
        </Typography>
        <ExpandIcon expanded={showSlider} sx={{ p: 0, fontSize: "1rem" }} />
      </Box>
      <Collapse in={showSlider}>
        <Box sx={{ px: 2 }}>
          <Slider
            size="small"
            marks={marks}
            value={live}
            min={cfg.bounds[0]}
            max={cfg.bounds[1]}
            step={cfg.step}
            disabled={!f.active}
            onClick={(e) => e.stopPropagation()}
            onChange={(_, v) => setLive(v as [number, number])}
            onChangeCommitted={(_, v) => onCommit(v as [number, number])}
            sx={{
              "& .MuiSlider-mark": {
                height: "10px",
                bgcolor: "currentColor",
              },
              "& .MuiSlider-thumb:hover": {
                boxShadow:
                  "0px 0px 0px 4px rgba(var(--mui-palette-primary-mainChannel) / 0.16)",
              },
            }}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Persistent feature-filter section. Each feature has an active toggle and a
 * range Slider; active features become part of the selection criteria (and are
 * baked into a layer on "Create layer").
 *
 * Props:
 *   feats     { [key]: { active, min, max } }
 */
export const FeatureFilters = ({ feats }: FeatureFiltersProps) => {
  const featureParams = useSelector(selectGlobalFeatureBounds);
  const relativeFeatureParams = useSelector(selectInViewFeatureBounds);
  const { toggleFeature, setFeatureRange } = useCriterionToggles();
  const [open, setFeatOpen] = useState(false);
  const handleToggleOpen = () => setFeatOpen((o) => !o);
  const activeCount = Object.values(feats).filter((f) => f.active).length;

  const handleFeatRange = (key: ObjectFeature, [min, max]: [number, number]) =>
    setFeatureRange(key, [min, max]);

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Box
        onClick={handleToggleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.25,
          cursor: "pointer",
        }}
        data-help={HelpItem.FeatureFilters}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".6px",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Object Features
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: activeCount ? 600 : 400,
              color: activeCount ? "primary.main" : "text.disabled",
            }}
          >
            {activeCount ? `${activeCount} active` : "none active"}
          </Typography>
          {open ? (
            <ExpandLessIcon sx={{ fontSize: 20, color: "action.active" }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 20, color: "action.active" }} />
          )}
        </Box>
      </Box>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2, pb: 1.5 }}>
          {(
            Object.entries(featureParams) as [ObjectFeature, FeatureConfig][]
          ).map(([key, cfg]) => (
            <FeatureRow
              key={key}
              cfg={cfg}
              localBounds={relativeFeatureParams[key].bounds}
              f={feats[key]}
              onToggle={() => toggleFeature(key)}
              onCommit={(range) => handleFeatRange(key, range)}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};
