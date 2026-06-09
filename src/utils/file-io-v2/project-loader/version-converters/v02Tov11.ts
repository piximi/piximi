import type {
  V02ClassifierState,
  V02Kind,
  V02PiximiState,
} from "../version-readers/version-types/v02Types";
import type {
  V11ClassifierState,
  V11KindClassifierDict,
  V11PiximiState,
} from "../version-readers/version-types/v11Types";

/**
 * Convert v0.2 project data to v1.1 format.
 *
 * Key transformations:
 * - Restructures classifier from global to per-kind format
 * - Data section (things, categories, kinds) passes through unchanged
 *   (V11 data types are identical to V02)
 *
 */
export function convertV02ToV11(
  v02: V02PiximiState,
  onProgress: (p: number) => void,
): V11PiximiState {
  const { classifier: oldClassifier, data } = v02;
  const classifier = v02_11_classifierConverter(oldClassifier, data.kinds.ids);
  onProgress(1);
  return {
    project: v02.project,
    data: v02.data,
    classifier,
  };
}

const v02_11_classifierConverter = (
  classifier: V02ClassifierState,
  kindIds: Array<V02Kind["id"]>,
): V11ClassifierState => {
  const kindClassifiers: V11KindClassifierDict = {};

  kindIds.forEach((kindId) => {
    kindClassifiers[kindId] = {
      modelNameOrArch: 0,
      modelInfoDict: {},
    };
  });
  return {
    showClearPredictionsWarning: true,
    kindClassifiers,
  };
};
