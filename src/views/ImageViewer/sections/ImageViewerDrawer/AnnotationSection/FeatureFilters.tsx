import { useEffect, useState } from "react";

import { Box, Collapse, Slider, Switch, Typography } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import ExpandIcon from "components/ui/ExpandIcon";

import type { FeatureKey } from "store/dataV2/types";

import { useCriterionToggles } from "./useCriterionToggles";

import type { FeatureParams } from "@ImageViewer/state/image-viewer-data/utils";
import type {
  FeatureConfig,
  FeatureRangeState,
  FeatureState,
} from "@ImageViewer/state/types";

interface FeatureFiltersProps {
  featureParams: FeatureParams;
  feats: FeatureState;
}

interface FeatureRowProps {
  cfg: FeatureConfig;
  f: FeatureRangeState;
  onToggle: () => void;
  onCommit: (range: [number, number]) => void;
}

// Local drag state so a slider drag only dispatches (and re-runs the filter
// pipeline) once, on release, instead of on every intermediate drag frame.
function FeatureRow({ cfg, f, onToggle, onCommit }: FeatureRowProps) {
  const [live, setLive] = useState<[number, number]>([f.min, f.max]);
  const [showSlider, setShowSlider] = useState(f.active);

  useEffect(() => {
    setLive([f.min, f.max]);
  }, [f.min, f.max]);

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
        <Box sx={{ px: 1 }}>
          <Slider
            size="small"
            value={live}
            min={cfg.bounds[0]}
            max={cfg.bounds[1]}
            step={cfg.step}
            disabled={!f.active}
            onClick={(e) => e.stopPropagation()}
            onChange={(_, v) => setLive(v as [number, number])}
            onChangeCommitted={(_, v) => onCommit(v as [number, number])}
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
 *   open, onToggleOpen
 *   onToggle(key)                  flip a feature's active flag
 *   onRange(key, [min, max])       update a feature's range (also activates it)
 */
export const FeatureFilters = ({
  featureParams,
  feats,
}: FeatureFiltersProps) => {
  const { toggleFeature, setFeatureRange } = useCriterionToggles();
  const [open, setFeatOpen] = useState(false);
  const handleToggleOpen = () => setFeatOpen((o) => !o);
  const activeCount = Object.values(feats).filter((f) => f.active).length;
  const handleToggleFeat = (key: FeatureKey, bounds: [number, number]) =>
    toggleFeature(key, bounds);
  const handleFeatRange = (key: FeatureKey, [min, max]: [number, number]) =>
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
            {activeCount ? `${activeCount} active` : "none"}
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
          {(Object.entries(featureParams) as [FeatureKey, FeatureConfig][]).map(
            ([key, cfg]) => (
              <FeatureRow
                key={key}
                cfg={cfg}
                f={feats[key]}
                onToggle={() => handleToggleFeat(key, cfg.bounds)}
                onCommit={(range) => handleFeatRange(key, range)}
              />
            ),
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
