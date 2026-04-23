import type { CSSProperties } from "react";

export const getIconPosition = (
  height: number | undefined,
  width: number | undefined,
) => {
  if (!height || !width) return { top: "0%", left: "0%" };
  const scaleBy = Math.max(width, height);
  const offsetY = ((1 - height / scaleBy) / 2) * 100;
  const offsetX = ((1 - width / scaleBy) / 2) * 100;
  return { top: offsetY + "%", left: offsetX + "%" };
};

export const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  top: 0,
  transform: "none",
};
