import {
  Path,
  PATH_SCHEMA,
} from "../../../SpatialComputingEngine/src/frontend-objects.js";
import {
  fetchData,
  saveData,
} from "../../../SpatialComputingEngine/src/spatial-computing-engine.js";

export const getReachableSpaces = async (
  ...args: unknown[]
): Promise<string | string[]> =>
  ((await fetchData(PATH_SCHEMA, args[0] as string)) as Path).reachable ??
  "Path does not exist!";

export const setFactory = async (
  ...args: unknown[]
): Promise<string | void> => {
  const path = (await fetchData(PATH_SCHEMA, args[0] as string)) as Path;
  if (path._type === undefined) return "Path does not exist!";
  path.factory = args[1] as string;
  await saveData(PATH_SCHEMA, path);
};

export const getFactory = async (...args: unknown[]): Promise<string> => {
  const path = (await fetchData(PATH_SCHEMA, args[0] as string)) as Path;
  if (path._type === undefined) return "Path does not exist!";
  return path.factory ?? "Path does not have factory!";
};
