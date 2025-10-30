import { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  Input,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";

import { dataSlice } from "store/data";
import { selectMetadataToTracklets } from "store/data/selectors";
import { selectAnnotationMeasurements } from "store/measurements/measurementDataSelectors";
import { measurementDataSlice } from "store/measurements/measurementDataSlice";
import { AnnotationObjectMeasurements } from "store/measurements/types";

import { selectAllImageViewerAnnotationRecord } from "views/ImageViewer/state/image-viewer-data/reselectors";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";
import { CenterOfMass, TrackerType } from "../utils/types";
import { BBoxTracker, CenterOfMassTracker } from "../utils";

export const AutoTrackCreation = () => {
  const dispatch = useDispatch();
  const annotations = useSelector(selectAllImageViewerAnnotationRecord);
  const activeMetadata = useSelector(selectActiveMetadata);
  const [threshold, setThreshold] = useState("75");
  const [finalValue, setFinalValue] = useState("75");
  const [includeIsolated, setIncludeIsolated] = useState(false);
  const [includeGap, setIncludeGap] = useState(false);
  const [gap, setGap] = useState("1");
  const [finalGap, setFinalGap] = useState("75");
  const [calculateRelationships, setCalculateRelationships] = useState(false);
  const [trackerType] = useState<TrackerType>("center-of-mass");
  const metadata2Tracklets = useSelector(selectMetadataToTracklets);
  const annotationMeasurements = useSelector(selectAnnotationMeasurements);
  const inputRef = useRef<HTMLInputElement>();

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
          gap: includeGap ? +gap : undefined,
          calculateTrackletRelationships: calculateRelationships,
        });
      case "bbox":
        return new BBoxTracker({
          overlapThreshold: +threshold,
          imageMetadataId: activeMetadata.id,
          numFrames: Object.keys(activeMetadata.images).length,
          includeIsolatedAnnotations: includeIsolated,
          gap: includeGap ? +gap : undefined,
          calculateTrackletRelationships: calculateRelationships,
        });
    }
  }, [
    trackerType,
    activeMetadata,
    threshold,
    includeIsolated,
    includeGap,
    gap,
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
    setGap(value);
  };

  const handleAutoTracking = () => {
    if (!tracker || !activeMetadata) return;
    const { tracks, coms } = tracker.computeTracks(annotations, annCOMs);
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

  const handleDeleteAllTracks = () => {
    if (!activeMetadata) return;
    dispatch(
      dataSlice.actions.batchDeleteTracklet(
        metadata2Tracklets[activeMetadata.id],
      ),
    );
  };
  return (
    <Stack alignItems="space-between" gap={1} sx={{ width: "100%" }}>
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
            endAdornment={<InputAdornment position="end">px</InputAdornment>}
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
          Calculate Tracklet Links:
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
          Gap Bridging:
        </Typography>

        <Checkbox
          checked={includeGap}
          onChange={() => setIncludeGap((val) => !val)}
          size="small"
          sx={{ px: 0, py: 0.5 }}
        />
      </Box>
      <Collapse in={includeGap} sx={{ width: "100%" }}>
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
          <FormControl size="small" variant="standard" sx={{ width: "3ch" }}>
            <Input
              value={gap}
              margin="dense"
              inputProps={{ style: { textAlign: "end" } }}
              sx={(theme) => ({
                fontSize: theme.typography.body2.fontSize,
              })}
              onChange={handleGapChange}
              onBlur={(event) => {
                if (event.target.value === "") setGap(finalGap);
                else setFinalGap(event.target.value);
              }}
            />
          </FormControl>
        </Box>
      </Collapse>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Button variant="text" onClick={handleAutoTracking} size="small">
          Generate
        </Button>
        <Button
          variant="text"
          disabled={
            !activeMetadata ||
            !metadata2Tracklets[activeMetadata.id] ||
            metadata2Tracklets[activeMetadata.id].length === 0
          }
          onClick={handleDeleteAllTracks}
          size="small"
        >
          Delete All
        </Button>
      </Box>
    </Stack>
  );
};
