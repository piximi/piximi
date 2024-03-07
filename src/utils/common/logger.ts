export const logger = (
  message: string,
  level: "log" | "warn" | "error" = "log"
) => {
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
