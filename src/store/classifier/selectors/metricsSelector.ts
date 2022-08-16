import { Classifier, Metric } from "types";

export const metricsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Array<Metric> => {
  return classifier.metrics;
};
