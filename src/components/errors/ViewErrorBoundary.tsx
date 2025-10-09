import { ErrorInfo, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ViewErrorFallback } from "./ViewErrorFallback";
import { logError } from "utils/logUtils";

type ViewErrorBoundaryProps = {
  children: ReactNode;
  viewName: string;
  returnRoute?: string;
  returnLabel?: string;
};

/**
 * View-level error boundary that wraps major views with context-aware error handling.
 * Provides navigation options to recover from errors without requiring full page reload.
 *
 * @param viewName - The name of the view (e.g., "ImageViewer", "ProjectViewer")
 * @param returnRoute - The route to navigate to on error recovery (default: "/project")
 * @param returnLabel - Custom label for the return button (default: derived from returnRoute)
 *
 * @example
 * <ViewErrorBoundary viewName="ImageViewer" returnRoute="/project" returnLabel="Project">
 *   <ImageViewerContent />
 * </ViewErrorBoundary>
 */
export const ViewErrorBoundary = ({
  children,
  viewName,
  returnRoute = "/project",
  returnLabel,
}: ViewErrorBoundaryProps) => {
  const handleError = (error: Error, info: ErrorInfo) => {
    logError(error, {
      context: `${viewName} View`,
      componentStack: info.componentStack,
      location: window.location.pathname,
      viewName: viewName,
    });
  };

  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <ViewErrorFallback
          {...props}
          viewName={viewName}
          returnRoute={returnRoute}
          returnLabel={returnLabel}
        />
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};
