import { useDispatch } from "react-redux";

import { useNumberField } from "hooks";

import { TextFieldWithBlur } from "components/inputs";

import { measurementsSlice } from "@MeasurementViewer/state";
import { DEFAULT_HISTOGRAM_BINS } from "@MeasurementViewer/utils";

import type { PlotDetail } from "@MeasurementViewer/types";

export const HistogramBinTextField = ({ plot }: { plot: PlotDetail }) => {
  const dispatch = useDispatch();

  const {
    inputValue: numBins,
    inputString: numBinsDisplay,
    setLastValidInput: setLastValidNumBins,
    resetInputValue: resetNumBins,
    handleOnChangeValidation: handleNumBinsChange,
    error: numBinsError,
  } = useNumberField(plot.chartConfig.numBins ?? DEFAULT_HISTOGRAM_BINS);

  const handleSubmit = (numBins: number) => {
    if (numBinsError.error) {
      resetNumBins();
      return;
    }
    if (numBins === plot.chartConfig.numBins) return;
    setLastValidNumBins(numBins);
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: plot.id,
        newConfig: { numBins },
      }),
    );
  };

  return (
    <TextFieldWithBlur
      id="bin-size-text-field"
      label="Number of Bins"
      value={numBinsDisplay}
      onChange={handleNumBinsChange}
      onBlur={() => handleSubmit(numBins)}
      size="small"
      variant="standard"
      fullWidth
      sx={{ pb: 1, mt: 1 }}
    />
  );
};
