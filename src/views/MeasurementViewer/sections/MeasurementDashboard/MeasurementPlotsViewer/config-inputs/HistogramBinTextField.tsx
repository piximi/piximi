import { useDispatch, useSelector } from "react-redux";

import { useNumberField } from "hooks";

import { TextFieldWithBlur } from "components/inputs";

import { measurementsSlice } from "@MeasurementViewer/state";
import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";

export const HistogramBinTextField = () => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return null;
  const dispatch = useDispatch();

  const {
    inputValue: numBins,
    inputString: numBinsDisplay,
    setLastValidInput: setLastValidNumBins,
    resetInputValue: resetNumBins,
    handleOnChangeValidation: handleNumBinsChange,
    error: numBinsError,
  } = useNumberField(selectedPlot.chartConfig.numBins!);

  const handleSubmit = (numBins: number) => {
    if (numBinsError.error) {
      resetNumBins();
      return;
    }
    if (numBins === selectedPlot.chartConfig.numBins) return;
    setLastValidNumBins(numBins);
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: selectedPlot.id,
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
