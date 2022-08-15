import { useDispatch } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import {
  HelpDrawer,
  FallBackHelpDrawer,
} from "../../common/Help/HelpDrawer/HelpDrawer";
import { HelpTopic } from "../../common/Help/HelpContent/HelpContent";

import { applicationSlice } from "store/slices";

import { AlertType } from "types";

export const AnnotatorHelpDrawer = () => {
  const dispatch = useDispatch();

  const helpContent: Array<HelpTopic> =
    require("../HelpContent/AnnotatorHelpContent.json").topics;

  const handleError = (error: Error, info: { componentStack: string }) => {
    dispatch(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Error,
          name: "Error in Annotator Help drawer",
          description: error.name + ": " + error.message,
          stackTrace: info.componentStack,
        },
      })
    );
  };

  return (
    <ErrorBoundary onError={handleError} FallbackComponent={FallBackHelpDrawer}>
      <HelpDrawer />
    </ErrorBoundary>
  );
};
