import Konva from "konva";
import { createContext } from "react";

export const StageContext = createContext<React.RefObject<Konva.Stage> | null>(
  null
);
