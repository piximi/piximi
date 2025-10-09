import {
  Box,
  Button,
  FormControl,
  Input,
  InputAdornment,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import { PartialDivider } from "components/ui/divider/PartialDivider";
import { useRef, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import { selectImageToAnnotations } from "store/data/selectors";
import { AnnotationObject } from "store/data/types";
import { generateUUID } from "store/data/utils";
import { getRandomColor } from "utils/colorUtils";

import { ButtonContainer } from "views/ImageViewer/components/ButtonContainer";
import { OperationButton } from "views/ImageViewer/components/OperationButton";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { selectAllImageViewerAnnotationRecord } from "views/ImageViewer/state/image-viewer-data/reselectors";
import {
  selectActiveMetadata,
  selectActiveMetadataId,
  selectActiveTrackId,
  selectTimeLinkingState,
} from "views/ImageViewer/state/image-viewer-data/selectors";
import { useSelectedTracklets } from "views/ImageViewer/state/TrackletContext";

export const TrackCreationControls = () => {
  const theme = useTheme();

  return (
    <Stack alignItems="flex-start">
      <PartialDivider
        containerStyle={{
          width: "100%",
        }}
        typographyVariant="caption"
        headerText="Manual"
        textTransform="uppercase"
        indentPercentage={5}
        color={theme.palette.grey[500]}
      />
      <ManualTrackCreation />
      <PartialDivider
        containerStyle={{
          width: "100%",
        }}
        typographyVariant="caption"
        headerText="Automatic"
        textTransform="uppercase"
        indentPercentage={5}
        color={theme.palette.grey[500]}
      />
      <AutoTrackCreation />
    </Stack>
  );
};

const ManualTrackCreation = () => {
  const dispatch = useDispatch();
  const active = useSelector(selectTimeLinkingState);
  const activeTrackId = useSelector(selectActiveTrackId);
  const activeMetadataId = useSelector(selectActiveMetadataId);
  const { primaryTrack, setPrimaryTrack, setSecondaryTracks } =
    useSelectedTracklets();
  const handleNewTrack = () => {
    if (!activeMetadataId) return;
    const newTrackletId = generateUUID();
    dispatch(imageViewerDataSlice.actions.startNewTrack(newTrackletId));
    dispatch(
      dataSlice.actions.addTracklet({
        metadataId: activeMetadataId,
        trackId: newTrackletId,
        color: getRandomColor(),
        linkedIds: [],
      }),
    );
  };
  const handleDeleteTrack = () => {
    dispatch(imageViewerDataSlice.actions.removeActiveTrack());
    activeTrackId && dispatch(dataSlice.actions.deleteTracklet(activeTrackId));
  };
  const handleConfirmTrack = () => {
    dispatch(imageViewerDataSlice.actions.toggleTimeLinking(false));
  };

  const handleEditTrack = () => {
    if (primaryTrack) {
      dispatch(imageViewerDataSlice.actions.setTLinkingTrackId(primaryTrack));
    }
    setPrimaryTrack(undefined);
    setSecondaryTracks([]);
  };
  return (
    <Stack alignItems="flex-start" sx={{ width: "100%" }}>
      <ButtonContainer>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <OperationButton onClick={handleNewTrack} disabled={active}>
            New Track
          </OperationButton>
          <OperationButton onClick={handleEditTrack} disabled={!primaryTrack}>
            Edit Track
          </OperationButton>
        </Box>
      </ButtonContainer>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <OperationButton onClick={handleConfirmTrack} disabled={!active}>
          Confirm
        </OperationButton>

        <OperationButton onClick={handleDeleteTrack} disabled={!active}>
          Delete
        </OperationButton>
      </Box>
    </Stack>
  );
};

type AnnotationInfo = Pick<AnnotationObject, "id" | "boundingBox" | "trackId">;
type OverlapResult = AnnotationInfo & {
  overlapArea: number;
};

function findOverlappingBoxes(
  targetBox: AnnotationInfo["boundingBox"],
  anns: AnnotationInfo[],
): OverlapResult[] {
  const [x1, y1, x2, y2] = targetBox;
  const targetArea = (x2 - x1) * (y2 - y1);

  return anns
    .map((ann) => {
      const [bx1, by1, bx2, by2] = ann.boundingBox;
      // Calculate the intersection rectangle
      const overlapX1 = Math.max(x1, bx1);
      const overlapY1 = Math.max(y1, by1);
      const overlapX2 = Math.min(x2, bx2);
      const overlapY2 = Math.min(y2, by2);

      // Check if there's an overlap
      if (overlapX1 < overlapX2 && overlapY1 < overlapY2) {
        const overlapArea = (overlapX2 - overlapX1) * (overlapY2 - overlapY1);
        const percentOverlap = Math.floor(100 * (overlapArea / targetArea));
        return { ...ann, overlapArea: percentOverlap };
      }

      return null;
    })
    .filter((result): result is OverlapResult => result !== null);
}

const bboxTracking = (
  annotations: Array<Array<AnnotationInfo>>,
  overlapThreshold: number,
) => {
  const tracks: Record<string, Array<string>> = {};
  const ann2TrackId: Record<string, string> = {};
  let i = 0;
  while (i < annotations.length - 1) {
    annotations[i].forEach((ann) => {
      let trackId: string;
      if (ann2TrackId[ann.id]) {
        trackId = ann2TrackId[ann.id];
      } else {
        trackId = generateUUID();
        tracks[trackId] = [ann.id];
        ann2TrackId[ann.id] = trackId;
      }
      const candidateAnns = annotations[i + 1].filter((ann) => !ann.trackId);
      const overlappedAnns = findOverlappingBoxes(
        ann.boundingBox,
        candidateAnns,
      );

      const thresholdedAnns = overlappedAnns.filter(
        (ann) => ann.overlapArea >= overlapThreshold,
      );
      thresholdedAnns.forEach((ann) => {
        tracks[trackId].push(ann.id);
        ann2TrackId[ann.id] = trackId;
      });
    });
    i++;
  }
  return tracks;
};

const AutoTrackCreation = () => {
  const dispatch = useDispatch();

  const annotations = useSelector(selectAllImageViewerAnnotationRecord);
  const imageToAnnotations = useSelector(selectImageToAnnotations);
  const activeMetadata = useSelector(selectActiveMetadata);
  const [overlapThreshold, setOverlapThreshold] = useState("75");
  const [finalValue, setFinalValue] = useState("75");

  const inputRef = useRef<HTMLInputElement>();

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
    setOverlapThreshold(value);
  };

  const handleAutoTracking = () => {
    if (!activeMetadata) return;
    const annotationArray = Object.values(activeMetadata.images).map((im) => {
      const imId = im.id;
      const imAnns = imageToAnnotations[imId];
      return imAnns.map((annId) => {
        return annotations[annId];
      });
    });
    const tracks = bboxTracking(annotationArray, +overlapThreshold);

    const tracksArray = Object.entries(tracks).reduce(
      (acc: { trackId: string; annIds: string[] }[], [trackId, annIds]) => {
        acc.push({ trackId, annIds });
        return acc;
      },
      [],
    );
    batch(() => {
      Object.entries(tracks).forEach(([trackId, annIds]) => {
        dispatch(
          dataSlice.actions.addTracklet({
            metadataId: activeMetadata.id,
            trackId,
            color: getRandomColor(),
            linkedIds: [],
          }),
        );

        dispatch(
          dataSlice.actions.batchUpdateAnnotation(
            annIds.map((id) => ({ id, changes: { trackId } })),
          ),
        );
      });
      dispatch(dataSlice.actions.batchAddAnnotationToTracklet(tracksArray));
    });
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
          px: 0.5,
        }}
      >
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          Overlap Threshold:
        </Typography>
        <FormControl size="small" variant="standard" sx={{ width: "5ch" }}>
          <Input
            ref={inputRef}
            value={overlapThreshold}
            endAdornment={<InputAdornment position="end">%</InputAdornment>}
            margin="dense"
            inputProps={{ style: { textAlign: "end" } }}
            sx={(theme) => ({
              fontSize: theme.typography.body2.fontSize,
            })}
            onChange={handleOverlapThresholdChange}
            onBlur={(event) => {
              if (event.target.value === "") setOverlapThreshold(finalValue);
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
        }}
      >
        <Button variant="text" onClick={handleAutoTracking} size="small">
          Generate
        </Button>
        <Button variant="text" disabled={true} size="small">
          Delete All
        </Button>
      </Box>
    </Stack>
  );
};
