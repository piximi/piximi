import { FallbackDialog } from "components/dialogs";
import { ErrorInfo, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { logError } from "utils/logUtils";

export const AppErrorBoundary = ({ children }: { children: ReactNode }) => {
  const handleError = (error: Error, info: ErrorInfo) => {
    logError(error, {
      context: "Application Root",
      componentStack: info.componentStack,
      location: window.location.pathname,
    });
  };

  return (
    <ErrorBoundary FallbackComponent={FallbackDialog} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};
