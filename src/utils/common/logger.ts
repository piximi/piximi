// ignore-no-logs

export const logger = (
  message: any | any[],
  level: "log" | "warn" | "error" = "log"
) => {
  if (Array.isArray(message)) {
    message = message.join("");
  }
  switch (level) {
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
};
