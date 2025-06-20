import { logger } from "utils/logUtils";
import { CustomStore } from "../zarr/stores";
import { openGroup } from "zarr";
import { getAttr } from "../zarr/zarrUtils";
import semver from "semver";
import { v01_deserializeProject } from "./v01/v01_deserializeProject";
import { v02_deserializeProject } from "./v02/v02_deserializeProject";
import { CurrentProject, LoadCB } from "../types";
import { v11_deserializeProject } from "./v110/v11_deserializeProject";
import { v01_02_projectConverter } from "../converters/v01_02_projectConverter";
import { v02_11_projectConverter } from "../converters/v02_11_projectConverter";
import { v11_12_projectConverter } from "../converters/v11_12_projectConverter";

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
  console.log(piximiVersion);
  let currentProject: CurrentProject | undefined;
  if (!semver.valid(piximiVersion) || semver.lt(piximiVersion!, "0.1.0")) {
    throw Error(`File version ${piximiVersion} is unsupported.`);
  } else if (semver.eq(piximiVersion!, "0.1.0")) {
    const v01Project = await v01_deserializeProject(fileStore, loadCb);
    const v02Project = v01_02_projectConverter(v01Project);
    const v11Project = v02_11_projectConverter(v02Project);
    currentProject = v11_12_projectConverter(v11Project);
  } else if (semver.lte(piximiVersion!, "1.0.0")) {
    const v02Project = await v02_deserializeProject(fileStore, loadCb);
    const v11Project = v02_11_projectConverter(v02Project);
    currentProject = v11_12_projectConverter(v11Project);
  } else if (semver.gte(piximiVersion!, "1.1.0")) {
    const v11Project = await v11_deserializeProject(fileStore, loadCb);
    currentProject = v11_12_projectConverter(v11Project);
  }
  return currentProject!;
};
