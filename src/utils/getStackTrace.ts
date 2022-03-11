import StackTrace from "stacktrace-js";

export const getStackTraceFromError = async (error: Error): Promise<string> => {
  var stacktrace = error.stack ? error.stack : "";
  try {
    var stackFrames = await StackTrace.fromError(error);
    stacktrace = stackFrames
      .map((stackFrame) => stackFrame.toString())
      .join("\n");
  } catch (error) {
    console.log("Could not resolve stacktrace", error);
  }

  return stacktrace;
};
