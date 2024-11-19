import { createContext } from "react";
import Konva from "konva";

export const StageContext = createContext<React.RefObject<Konva.Stage> | null>(
  null
);
