import { useDispatch } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import HelpDrawer, { FallBackHelpDrawer } from "./HelpDrawer";
import { HelpTopic } from "../HelpContent/HelpContent";

import { applicationSlice } from "store/slices";

import { AlertType } from "types";

export const ClassifierHelpDrawer = () => {
  const dispatch = useDispatch();

  const helpContent: Array<HelpTopic> =
    require("../HelpContent/ClassifierHelpContent.json").topics;

  const handleError = (error: Error, info: { componentStack: string }) => {
    dispatch(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Error,
          name: "Error in Classifier Help drawer",
          description: error.name + ": " + error.message,
          stackTrace: info.componentStack,
        },
      })
    );
  };

  return (
    <ErrorBoundary onError={handleError} FallbackComponent={FallBackHelpDrawer}>
      <HelpDrawer helpContent={helpContent} appBarOffset={true} />
    </ErrorBoundary>
  );
};
