import { logger } from "utils/common/helpers";
import { CustomStore } from "../zarrStores";
import { openGroup } from "zarr";
import { getAttr } from "./helpers";
import semver from "semver";
import { deserializeProject_v1 } from "./v1/deserializeProject_v1";
import { dataConverter_v1v2 } from "utils/file-io/converters/dataConverter_v1v2";
import { deserializeProject_v2 } from "./v2/deserializeProject_v2";
import { LoadCB } from "../types";

export const deserializeProject = async (
  fileStore: CustomStore,
  loadCb: LoadCB
) => {
  process.env.REACT_APP_LOG_LEVEL === "1" &&
    logger(`starting deserialization of ${fileStore.rootName}`);

  const rootGroup = await openGroup(fileStore, fileStore.rootName, "r");

  const piximiVersionRaw = (await getAttr(rootGroup, "version")) as string;
  const piximiVersion = semver.clean(piximiVersionRaw);

  if (!semver.valid(piximiVersion) || semver.lt(piximiVersion!, "0.1.0")) {
    throw Error(`File version ${piximiVersion} is unsupported.`);
  } else if (semver.eq(piximiVersion!, "0.1.0")) {
    const { project, classifier, data, segmenter } =
      await deserializeProject_v1(fileStore, loadCb);
    const { kinds, categories, things } = dataConverter_v1v2({
      images: data.images,
      annotations: data.annotations,
      annotationCategories: data.annotationCategories,
      oldCategories: data.categories,
    });
    return {
      project,
      classifier,
      segmenter,
      data: { kinds, categories, things },
    };
  } else if (semver.eq(piximiVersion!, "0.2.0")) {
    const { project, classifier, data, segmenter } =
      await deserializeProject_v2(fileStore, loadCb);

    return {
      project,
      classifier,
      segmenter,
      data,
    };
  }
};
