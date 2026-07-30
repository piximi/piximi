import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Link,
} from "@mui/material";

import { FilterPipeline } from "./FilterPipeline";
import { FeatureFilters } from "./FeatureFilters";
import { CategoryTree } from "./CategoryTree";
import { SelectionFooter } from "./SelectionFooter";
import { useAnnotationSelection } from "./useAnnotationSelection";

import type { PlaneScope } from "@ImageViewer/state/types";

export const AnnotationSection = () => {
  const {
    kinds,
    currentPlane,
    totalPlanes,
    annotations,
    filterLayer,
    feats,
    relativeFeatures,
    planeScope,
    setPlaneScope,
    mode,
    setMode,
    view,
    groups,
    anySel,
    selectedIds,
    planeCount,
    selSummary,
    selectAll,
    clearSel,
    handleApplyFilter,
    handleToggleFilter,
    handleDeleteFilter,
    idsForScope,
  } = useAnnotationSelection();

  const treeHeader = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        pt: 1.25,
        pb: 0.5,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".5px",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Categories · {view.length} in view
      </Typography>
      <Link
        component="button"
        underline="none"
        onClick={selectAll}
        sx={{ fontSize: 12, fontWeight: 500 }}
      >
        Select all
      </Link>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexGrow: 1,
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        minHeight: 0,
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* header */}
      <Box sx={{ width: "100%", px: 2, pt: 1.5, pb: 1.25, flex: "none" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.25,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
            Annotations
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            plane {currentPlane + 1}/{totalPlanes}
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={planeScope}
          onChange={(_: React.MouseEvent<HTMLElement>, v: PlaneScope | null) =>
            v && setPlaneScope(v)
          }
          sx={{
            "& .MuiButtonBase-root": {
              py: 0.5,
              width: "50%",
              textTransform: "capitalize",
            },
          }}
        >
          <ToggleButton value="current">Current plane</ToggleButton>
          <ToggleButton value="stack">Whole stack</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* scrolling middle */}
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          minHeight: 0,
          overflow: "scroll",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <FilterPipeline
          kinds={kinds}
          layer={filterLayer}
          viewCount={view.length}
          mode={mode}
          onMode={setMode}
          onApply={handleApplyFilter}
          onToggle={handleToggleFilter}
          onDelete={handleDeleteFilter}
          anySel={anySel}
        />
        <FeatureFilters featureParams={relativeFeatures} feats={feats} />
        <CategoryTree
          groups={groups.list}
          hiddenCount={groups.hidden}
          header={treeHeader}
        />
      </Box>
      <SelectionFooter
        selSummary={selSummary}
        anySel={anySel}
        selectedCount={selectedIds.length}
        viewCount={view.length}
        planeCount={planeCount}
        totalCount={annotations.length}
        onClear={clearSel}
        scopeToAnnotations={idsForScope}
      />
    </Box>
  );
};
