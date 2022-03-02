import { HelpTopic } from "../HelpContent/HelpContent";
import HelpDrawer from "./HelpDrawer";

export const ClassifierHelpDrawer = () => {
  const helpContent: Array<HelpTopic> =
    require("../HelpContent/ClassifierHelpContent.json").topics;

  return <HelpDrawer helpContent={helpContent} appBarOffset={true} />;
};
