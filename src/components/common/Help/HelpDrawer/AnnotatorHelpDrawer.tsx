import { HelpTopic } from "../HelpContent/HelpContent";
import HelpDrawer from "./HelpDrawer";

export const AnnotatorHelpDrawer = () => {
  const helpContent: Array<HelpTopic> =
    require("../HelpContent/AnnotatorHelpContent.json").topics;

  return <HelpDrawer helpContent={helpContent} />;
};
