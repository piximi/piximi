import { Classifier } from "../../types/Classifier";
import { Metric } from "../../types/Metric";

export const metricsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Array<Metric> => {
  return classifier.metrics;
};
