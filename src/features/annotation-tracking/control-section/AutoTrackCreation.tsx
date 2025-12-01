import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";

import { dataSlice } from "store/data";
import { selectKindEntities } from "store/data/selectors";
import { selectAnnotationMeasurements } from "store/measurements/measurementDataSelectors";
import { measurementDataSlice } from "store/measurements/measurementDataSlice";
import { AnnotationObjectMeasurements } from "store/measurements/types";

import { selectActiveMetadataDecodedAnnotationRecord } from "views/ImageViewer/state/image-viewer-data/reselectors";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";
import { CenterOfMass, TrackerType } from "../utils/types";
import { BBoxTracker, CenterOfMassTracker } from "../utils";
import { IMAGE_KIND } from "store/data/constants";
import { OperationButtonRow } from "features/components/OperationButtonRow";
import { StyledSelect } from "components/inputs";

export const AutoTrackCreation = () => {
  const dispatch = useDispatch();
  const annotations = useSelector(selectActiveMetadataDecodedAnnotationRecord);
  const activeMetadata = useSelector(selectActiveMetadata);
  const kinds = useSelector(selectKindEntities);

  const annotationMeasurements = useSelector(selectAnnotationMeasurements);
  const [showSettings, setShowSettings] = useState(false);
  const [threshold, setThreshold] = useState("75");
  const [finalValue, setFinalValue] = useState("75");
  const [includeIsolated, setIncludeIsolated] = useState(false);
  const [includeGapClosing, setIncludeGapClosing] = useState(false);
  const [gapClosingDist, setGapClosingDist] = useState("1");
  const [finalGapClosingDist, setFinalGapClosingDist] = useState("75");
  const [calculateRelationships, setCalculateRelationships] = useState(false);
  const [trackerType] = useState<TrackerType>("center-of-mass");
  const [trackKind, setTrackKind] = useState<string>("All");
  const inputRef = useRef<HTMLInputElement>();

  const kindSelectOptions = useMemo(() => {
    const options = ["All"];
    Object.values(kinds).forEach((kind) => {
      if (kind.id !== IMAGE_KIND) options.push(kind.id);
    });
    return options;
  }, [kinds]);

  useEffect(() => {
    if (!kinds[trackKind]) setTrackKind("All");
  }, [kinds, trackKind]);

  const annCOMs = useMemo(() => {
    return Object.entries(annotationMeasurements).reduce(
      (annCOMs: Record<string, CenterOfMass>, [id, measurements]) => {
        const annCOM = measurements["object-geometry-com"];
        if (annCOM)
          annCOMs[id] = { annotationId: id, x: annCOM.x, y: annCOM.y };
        return annCOMs;
      },
      {},
    );
  }, [annotationMeasurements]);

  const tracker = useMemo(() => {
    if (!activeMetadata) return;
    switch (trackerType) {
      case "center-of-mass":
        return new CenterOfMassTracker({
          maxDistance: +threshold,
          imageMetadataId: activeMetadata.id,
          numFrames: Object.keys(activeMetadata.images).length,
          includeIsolatedAnnotations: includeIsolated,
          gapClosingDist: includeGapClosing ? +gapClosingDist : undefined,
          calculateTrackletRelationships: calculateRelationships,
        });
      case "bbox":
        return new BBoxTracker({
          overlapThreshold: +threshold,
          imageMetadataId: activeMetadata.id,
          numFrames: Object.keys(activeMetadata.images).length,
          includeIsolatedAnnotations: includeIsolated,
          gapClosingDist: includeGapClosing ? +gapClosingDist : undefined,
          calculateTrackletRelationships: calculateRelationships,
        });
    }
  }, [
    trackerType,
    activeMetadata,
    threshold,
    includeIsolated,
    includeGapClosing,
    gapClosingDist,
    calculateRelationships,
  ]);

  const handleOverlapThresholdChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    const numValue = +event.target.value;
    if (
      value !== "" &&
      (Number.isNaN(numValue) || numValue <= 0 || numValue > 100)
    )
      return;
    setThreshold(value);
  };

  const handleGapChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    const numValue = +event.target.value;
    if (
      value !== "" &&
      (Number.isNaN(numValue) || numValue <= 0 || numValue > 100)
    )
      return;
    setGapClosingDist(value);
  };

  const handleAutoTracking = () => {
    if (!tracker || !activeMetadata) return;
    const { tracks, coms } = tracker.computeTracks(
      annotations,
      trackKind,
      annCOMs,
    );
    if (tracks.length > 0) {
      dispatch(
        measurementDataSlice.actions.batchAddAnnotationObjectMeasurement(
          Object.keys(coms).reduce(
            (
              measurements: Record<string, AnnotationObjectMeasurements>,
              id,
            ) => {
              measurements[id] = {
                "object-geometry-com": { x: coms[id].x, y: coms[id].y },
              };
              return measurements;
            },
            {},
          ),
        ),
      );
      dispatch(dataSlice.actions.batchAddTracklet(tracks));
    }
  };

  const handleShowSettings = () => {
    setShowSettings((showSettings) => !showSettings);
  };

  return (
    <Stack sx={{ width: "100%", pt: 1, pb: 2 }}>
      <Divider />
      <OperationButtonRow>
        <Button variant="text" onClick={handleAutoTracking} size="small">
          Auto Generate
        </Button>
        <IconButton size="small" onClick={handleShowSettings}>
          <TuneIcon
            sx={(theme) => ({
              color: showSettings ? theme.palette.primary.main : undefined,
            })}
          />
        </IconButton>
      </OperationButtonRow>

      <Collapse
        in={showSettings}
        sx={(theme) => ({ bgcolor: theme.palette.background.default })}
      >
        <Stack alignItems="space-between" gap={1} sx={{ width: "100%", py: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Kind:
            </Typography>

            <StyledSelect
              value={trackKind}
              onChange={(event) => {
                const kind = event.target.value as string;
                setTrackKind(kind);
              }}
              autoWidth
              variant="standard"
            >
              {kindSelectOptions.map((kindId) => (
                <MenuItem key={kindId} value={kindId}>
                  {kindId === "All" ? "All" : kinds[kindId].displayName}
                </MenuItem>
              ))}
            </StyledSelect>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Distance Threshold:
            </Typography>
            <FormControl size="small" variant="standard" sx={{ width: "5ch" }}>
              <Input
                ref={inputRef}
                value={threshold}
                endAdornment={
                  <InputAdornment position="end">px</InputAdornment>
                }
                margin="dense"
                inputProps={{ style: { textAlign: "end" } }}
                sx={(theme) => ({
                  fontSize: theme.typography.body2.fontSize,
                })}
                onChange={handleOverlapThresholdChange}
                onBlur={(event) => {
                  if (event.target.value === "") setThreshold(finalValue);
                  else setFinalValue(event.target.value);
                }}
              />
            </FormControl>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Calculate Lineages:
            </Typography>

            <Checkbox
              checked={calculateRelationships}
              onChange={() => setCalculateRelationships((val) => !val)}
              size="small"
              sx={{ px: 0, py: 0.5 }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Include Isolated:
            </Typography>

            <Checkbox
              checked={includeIsolated}
              onChange={() => setIncludeIsolated((val) => !val)}
              size="small"
              sx={{ px: 0, py: 0.5 }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Gap Closing:
            </Typography>

            <Checkbox
              checked={includeGapClosing}
              onChange={() => setIncludeGapClosing((val) => !val)}
              size="small"
              sx={{ px: 0, py: 0.5 }}
            />
          </Box>
          <Collapse in={includeGapClosing} sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
              }}
            >
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                Max Gap:
              </Typography>
              <FormControl
                size="small"
                variant="standard"
                sx={{ width: "3ch" }}
              >
                <Input
                  value={gapClosingDist}
                  margin="dense"
                  inputProps={{ style: { textAlign: "end" } }}
                  sx={(theme) => ({
                    fontSize: theme.typography.body2.fontSize,
                  })}
                  onChange={handleGapChange}
                  onBlur={(event) => {
                    if (event.target.value === "")
                      setGapClosingDist(finalGapClosingDist);
                    else setFinalGapClosingDist(event.target.value);
                  }}
                />
              </FormControl>
            </Box>
          </Collapse>
        </Stack>
      </Collapse>
      <Divider />
    </Stack>
  );
};
