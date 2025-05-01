// ignore-no-logs
import { AlertType } from "./enums";

/*
  ERROR HANDLING / LOGGING
*/
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
