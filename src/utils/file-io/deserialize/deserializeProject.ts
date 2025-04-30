import { logger } from "utils/common/helpers";
import { CustomStore } from "../zarrStores";
import { openGroup } from "zarr";
import { getAttr } from "./helpers";
import semver from "semver";
import { deserializeProject_v01 } from "./v01/deserializeProject_v01";
import { dataConverter_v01v02 } from "utils/file-io/converters/dataConverter_v01v02";
import { deserializeProject_v02 } from "./v02/deserializeProject_v02";
import { LoadCB } from "../types";
import { deserializeProject_v11 } from "./v110/deserializeProject_v11";
import { projectConverterv1_v11 } from "../converters/classifierConverterv1_v11";

export const deserializeProject = async (
  fileStore: CustomStore,
  loadCb: LoadCB,
) => {
  import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    logger(`starting deserialization of ${fileStore.rootName}`);

  const rootGroup = await openGroup(fileStore, fileStore.rootName, "r");

  const piximiVersionRaw = (await getAttr(rootGroup, "version")) as string;
  if (!piximiVersionRaw) {
    throw Error("No version field found.");
  }
  const piximiVersion = semver.clean(piximiVersionRaw);

  if (!semver.valid(piximiVersion) || semver.lt(piximiVersion!, "0.1.0")) {
    throw Error(`File version ${piximiVersion} is unsupported.`);
  } else if (semver.eq(piximiVersion!, "0.1.0")) {
    const {
      project,
      classifier: oldClassifier,
      data,
      segmenter,
    } = await deserializeProject_v01(fileStore, loadCb);
    const { kinds, categories, things } = dataConverter_v01v02({
      images: data.images,
      annotations: data.annotations,
      annotationCategories: data.annotationCategories,
      oldCategories: data.categories,
    });
    const classifier = projectConverterv1_v11(oldClassifier, kinds.ids);
    return {
      project,
      classifier,
      segmenter,
      data: { kinds, categories, things },
    };
  } else if (semver.lte(piximiVersion!, "1.0.0")) {
    const {
      project,
      classifier: oldClassifier,
      data,
      segmenter,
    } = await deserializeProject_v02(fileStore, loadCb);
    const classifier = projectConverterv1_v11(oldClassifier, data.kinds.ids);

    return {
      project,
      classifier,
      segmenter,
      data,
    };
  } else if (semver.gte(piximiVersion!, "1.1.0")) {
    const { project, classifier, data, segmenter } =
      await deserializeProject_v11(fileStore, loadCb);

    return {
      project,
      classifier,
      segmenter,
      data,
    };
  }
};
