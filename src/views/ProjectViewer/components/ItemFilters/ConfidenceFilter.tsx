import { useCallback, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Box, Collapse, Slider, styled } from "@mui/material";

import { useDebounce } from "hooks";

import { selectActiveViewState } from "@ProjectViewer/state/selectors";
import { projectSlice } from "@ProjectViewer/state";

import { SectionHeader } from "./SectionHeader";

const StyledSlider = styled(Slider)(({ theme }) => ({
  height: 5,
  padding: "15px 0",
  "& .MuiSlider-thumb": {
    height: 15,
    width: 15,
    boxShadow: "0 0 2px 0px rgba(0, 0, 0, 0.1)",
  },
  "& .MuiSlider-valueLabel": {
    fontSize: 12,
    fontWeight: "normal",
    top: 4,
    transform: "translateX(4px) translateY(-100%) scale(1)",

    backgroundColor: "unset",
  },
  "& .MuiSlider-track": {
    border: "none",
    height: 5,
    color: theme.palette.primary.main,
  },
  "& .MuiSlider-rail": {
    opacity: 0.5,
    height: 3,
    boxShadow: "inset 0px 0px 2px -2px #000",
  },
}));

export const ConfidenceFilter = () => {
  const dispatch = useDispatch();
  const activeView = useSelector(selectActiveViewState);
  const [showFilters, setShowFilters] = useState(false);
  const confidence = useMemo(
    (): [number, number] => [
      activeView.filters.predictionConfidence.min,
      activeView.filters.predictionConfidence.max,
    ],
    [activeView.filters.predictionConfidence],
  );
  const [sliderValue, setSliderValue] = useState<[number, number]>(confidence);

  const dispatchOps = useCallback(
    (sliderValue: [number, number]) => {
      activeView.view === "images"
        ? dispatch(
            projectSlice.actions.setImageConfidenceFilter({
              min: sliderValue[0],
              max: sliderValue[1],
            }),
          )
        : dispatch(
            projectSlice.actions.setAnnotationConfidenceFilter({
              kindId: activeView.id,
              predictionConfidence: {
                min: sliderValue[0],
                max: sliderValue[1],
              },
            }),
          );
    },
    [activeView],
  );
  const debouncedDispatch = useDebounce(dispatchOps, 100);
  const handleSliderValueChange = (v: number | number[]) => {
    if (!Array.isArray(v) || v.length !== 2) return;
    setSliderValue(v as [number, number]);
    debouncedDispatch(v as [number, number]);
  };

  return (
    <Box>
      <SectionHeader
        title="Prediction Confidence"
        onExpand={() => setShowFilters((v) => !v)}
        hasActiveFilters={sliderValue[0] !== 0 || sliderValue[1] !== 100}
        expanded={showFilters}
      />

      <Collapse in={showFilters}>
        <Box sx={{ pt: "16px", mx: 4 }}>
          <StyledSlider
            value={sliderValue}
            min={0}
            max={100}
            step={1}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => value + "%"}
            onChange={(_, v) => handleSliderValueChange(v)}
          />
        </Box>
      </Collapse>
    </Box>
  );
};
