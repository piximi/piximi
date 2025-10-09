// ignore-no-logs
import StackTrace from "stacktrace-js";
import { AlertType } from "./enums";

/*
  ERROR HANDLING / LOGGING
*/

export type ErrorContext = {
  context?: string;
  componentStack?: string;
  location?: string;
  viewName?: string;
  sectionName?: string;
  reduxState?: any;
  userActions?: string[];
  additionalInfo?: Record<string, any>;
};

export const getStackTraceFromError = async (error: Error): Promise<string> => {
  let stacktrace = error.stack ? error.stack : "";
  try {
    const stackFrames = await StackTrace.fromError(error);
    stacktrace = stackFrames
      .map((stackFrame) => stackFrame.toString())
      .join("\n");
  } catch (error) {
    console.error("Could not resolve stacktrace", error);
  }

  return stacktrace;
};

export const createGitHubIssue = (
  title: string,
  body: string,
  alertType: AlertType = AlertType.Error,
) => {
  const label = alertType === AlertType.Error ? "bug" : "help%20wanted";
  const url =
    "https://github.com/piximi/piximi/issues/new?title=" +
    encodeURIComponent(title) +
    "&labels=" +
    label +
    "&body=" +
    encodeURIComponent(body);
  window.open(url);
};

export const logger = (
  message: any | any[],
  options?: { level?: "log" | "warn" | "error"; dev?: boolean },
) => {
  if (!options) {
    options = { level: "log" };
  } else {
    if (!options.level) {
      options.level = "log";
    }
  }
  if (Array.isArray(message)) {
    message = message.join("");
  }
  if (options?.dev) {
    if (import.meta.env.NODE_ENV !== "production") {
      switch (options.level) {
        case "log":
          console.log(message);
          break;
        case "warn":
          console.warn(message);
          break;
        case "error":
          console.error(message);
          break;
        default:
          break;
      }
    }
  } else {
    switch (options.level) {
      case "log":
        console.log(message);
        break;
      case "warn":
        console.warn(message);
        break;
      case "error":
        console.error(message);
        break;
      default:
        break;
    }
  }
};

/**
 * Enhanced error logging function for error boundaries and async error handlers.
 * Logs errors with additional context information for better debugging.
 *
 * @param error - The error object to log
 * @param context - Additional context information about where and how the error occurred
 *
 * @example
 * logError(error, {
 *   context: 'Application Root',
 *   componentStack: info.componentStack,
 *   location: window.location.pathname,
 * });
 */
export const logError = (error: Error, context?: ErrorContext): void => {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...context,
  };

  // Log to console in development with full context
  if (import.meta.env.NODE_ENV !== "production") {
    console.group(`Error in ${context?.context || "Application"}`);
    console.error("Error:", error);
    if (context?.componentStack) {
      console.error("Component Stack:", context.componentStack);
    }
    if (context?.location) {
      console.error("Location:", context.location);
    }
    if (context?.viewName) {
      console.error("View:", context.viewName);
    }
    if (context?.sectionName) {
      console.error("Section:", context.sectionName);
    }
    if (context?.additionalInfo) {
      console.error("Additional Info:", context.additionalInfo);
    }
    console.groupEnd();
  } else {
    // In production, log condensed error info
    console.error(
      `Error in ${context?.context || "Application"}:`,
      error.message,
    );
  }

  // TODO: Add error reporting service integration here
  // Example: sendToErrorReportingService(errorInfo);

  // Store error in session storage for debugging (last 10 errors)
  try {
    const storedErrors = JSON.parse(
      sessionStorage.getItem("piximi_errors") || "[]",
    );
    storedErrors.push({
      ...errorInfo,
      // Sanitize stack to avoid storing too much data
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
    });
    // Keep only last 10 errors
    const recentErrors = storedErrors.slice(-10);
    sessionStorage.setItem("piximi_errors", JSON.stringify(recentErrors));
  } catch (storageError) {
    // Fail silently if sessionStorage is unavailable
    console.warn("Could not store error in sessionStorage:", storageError);
  }
};
