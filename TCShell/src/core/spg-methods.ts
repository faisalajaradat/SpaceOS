import { Entity, EntityId } from "redis-om";
import {
  connectAndGetRepo,
  fetchAll,
  fetchData,
  isControlSpace,
  MergeSpace,
  OpenSpace,
  Path,
  PATH_SCHEMA,
  saveData,
  SelectionSpace,
  Space,
  SPACE_SCHEMA,
  SpacePathGraph,
  SPG_SCHEMA,
} from "../../../SpatialComputingEngine/src/index.js";
import {
  JourneyNode,
  jsonReplacer,
  jsonReviver,
  SPGStruct,
} from "./program.js";
import { receiveEntity, sendEntity } from "./space-methods.js";

const enum SPG_ERROR {
  DNE = "SPG does not exist!",
  IS_FINAL = "SPG is final!",
  NOT_FINAL = "SPG is not final!",
}

async function updateReachable(
  struct: SPGStruct,
  space: string,
): Promise<Array<string>> {
  const stack = [space];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const curSpace = stack.pop();
    if (visited.has(curSpace)) continue;
    visited.add(curSpace);
    stack.push(
      ...(await fetchAll(PATH_SCHEMA, struct.table.get(curSpace)))
        .map((path: Path) => path.target)
        .filter((spaceId) => !visited.has(spaceId)),
    );
  }
  return Array.from(visited);
}

async function searchSPG(
  struct: SPGStruct,
  start: string,
  end: string,
): Promise<JourneyNode> {
  const queue = new Array<JourneyNode>();
  const explored = new Set<string>();
  const startNode: JourneyNode = { parent: null, spaceId: start };
  explored.add(start);
  queue.push(startNode);
  while (queue.length > 0) {
    const nextSpace: JourneyNode = queue.shift();
    if (nextSpace.spaceId === end) return nextSpace;
    (await fetchAll(PATH_SCHEMA, struct.table.get(nextSpace.spaceId)))
      .filter(
        (path: Path) =>
          path.reachable.includes(end) && !explored.has(path.target),
      )
      .forEach((path: Path) => {
        explored.add(path.target);
        queue.push({ parent: nextSpace, spaceId: path.target });
      });
  }
}

async function addPathSpaceFunctionality(
  spg: SpacePathGraph,
  struct: SPGStruct,
  rootSpaceId: string,
  pathId: string,
  newSpaceId: string,
): Promise<void | string> {
  const path = (await fetchData(PATH_SCHEMA, pathId)) as Path;
  if (path._type === undefined) return "Path does not exist!";
  const rootNodePaths = struct.table.get(rootSpaceId);
  if (rootNodePaths !== undefined) rootNodePaths.push(pathId);
  else struct.table.set(rootSpaceId, [pathId]);
  if (!struct.table.has(newSpaceId)) struct.table.set(newSpaceId, []);
  spg.structJSON = JSON.stringify(struct, jsonReplacer, 4);
  await saveData(SPG_SCHEMA, spg);
  path.target = newSpaceId;
  path.reachable = await updateReachable(struct, path.target);
  await saveData(PATH_SCHEMA, path);
}

export const setRoot = async (...args: unknown[]): Promise<string | void> => {
  const spg: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    args[0] as string,
  )) as SpacePathGraph;
  if (spg.structJSON === undefined) return SPG_ERROR.DNE;
  const struct: SPGStruct = JSON.parse(
    spg.structJSON,
    jsonReviver,
  ) as SPGStruct;
  if (!struct.table.has(args[1] as string))
    return "Cannot delegate root to space not in graph!";
  struct.root = args[1] as string;
  spg.structJSON = JSON.stringify(struct, jsonReplacer, 4);
  await saveData(SPG_SCHEMA, spg);
};

export const addPathSpace = async (
  ...args: unknown[]
): Promise<string | void> => {
  const spg: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    args[0] as string,
  )) as SpacePathGraph;
  if (spg.structJSON === undefined) return SPG_ERROR.DNE;
  if (spg.final) return SPG_ERROR.IS_FINAL;
  const struct: SPGStruct = JSON.parse(
    spg.structJSON,
    jsonReviver,
  ) as SPGStruct;
  const rootSpace: Space = (await fetchData(
    SPACE_SCHEMA,
    struct.root,
  )) as Space;
  if (rootSpace.innerSpace === (args[2] as string))
    return "Cannot path root space to its inner space!";
  if (isControlSpace(rootSpace) && rootSpace._type === "SelectionSpace")
    return "Cannot extend selection space!";

  return await addPathSpaceFunctionality(
    spg,
    struct,
    struct.root,
    args[1] as string,
    args[2] as string,
  );
};

export const splitPath = async (...args: unknown[]): Promise<string> => {
  const spg: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    args[0] as string,
  )) as SpacePathGraph;
  const originalPath: Path = (await fetchData(
    PATH_SCHEMA,
    args[1] as string,
  )) as Path;
  if (originalPath._type) return "Path does not exist!";
  if (spg.structJSON) return SPG_ERROR.DNE;
  if (originalPath.target === undefined || originalPath.reachable.length < 1)
    return "Path is not in SPG!";
  if (spg.final) return SPG_ERROR.IS_FINAL;
  Promise.all(
    (
      (await (await connectAndGetRepo(PATH_SCHEMA))
        .search()
        .where("name")
        .equals(originalPath.name)
        .and("segment")
        .greaterThan(originalPath.segment)
        .returnAll()) as Path[]
    ).map(async (path) => {
      path.segment++;
      await saveData(PATH_SCHEMA, path);
    }),
  );
  const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
  const endSpace = originalPath.target;
  const intermediateSpaceLocation = JSON.stringify(
    { x: 0, y: 0 },
    jsonReplacer,
  );
  const intermediateSpace = new OpenSpace(
    "virtual",
    true,
    intermediateSpaceLocation,
  );
  const intermediateSpaceId = await saveData(SPACE_SCHEMA, intermediateSpace);
  const newPath = new Path(originalPath.locality, originalPath.segment++);
  newPath._type = originalPath._type;
  newPath.name = originalPath.name;
  const newPathId = await saveData(PATH_SCHEMA, newPath);
  await addPathSpaceFunctionality(
    spg,
    struct,
    intermediateSpaceId,
    newPathId,
    endSpace,
  );
  originalPath.target = intermediateSpaceId;
  originalPath.reachable.push(intermediateSpaceId);
  await saveData(PATH_SCHEMA, originalPath);
  return newPathId;
};

export const getStructJSON = async (...args: unknown[]): Promise<string> =>
  ((await fetchData(SPG_SCHEMA, args[0] as string)) as SpacePathGraph)
    .structJSON ?? SPG_ERROR.DNE;

export const sendEntityThrough = async (
  ...args: unknown[]
): Promise<string | void> => {
  const spg: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    args[0] as string,
  )) as SpacePathGraph;
  if (spg.structJSON === undefined) return SPG_ERROR.DNE;
  if (!spg.final) return SPG_ERROR.NOT_FINAL;
  const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
  let journeyEndNode = await searchSPG(
    struct,
    args[2] as string,
    args[3] as string,
  );
  const journeyStack = new Array<string>();
  while (journeyEndNode !== null) {
    journeyStack.push(journeyEndNode.spaceId);
    journeyEndNode = journeyEndNode.parent;
  }
  while (journeyStack.length > 1) {
    const curSpaceId = journeyStack.pop();
    const targetSpaceId = journeyStack.at(-1);
    const pathId = (
      (await fetchAll(PATH_SCHEMA, struct.table.get(curSpaceId))).filter(
        (path: Path) => path.reachable.includes(targetSpaceId),
      )[0] as Entity
    )[EntityId];
    const sendError = await sendEntity(curSpaceId, args[1], pathId, args[4]);
    if (sendError !== undefined) return sendError;
    const receiveError = await receiveEntity(targetSpaceId, args[1], args[4]);
    if (receiveError !== undefined) return receiveError;
  }
};

export const createMergeSpace = async (...args: unknown[]): Promise<string> => {
  const spg: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    args[0] as string,
  )) as SpacePathGraph;
  if (spg.structJSON === undefined) return SPG_ERROR.DNE;
  if (spg.final) return SPG_ERROR.IS_FINAL;
  const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
  const mergeSpaceId = await saveData(
    SPACE_SCHEMA,
    new MergeSpace(
      false,
      args[2] as string,
      args[4] as string,
      "virtual",
      JSON.stringify({ x: 0, y: 0 }, jsonReplacer),
    ),
  );
  let addPathResult = await addPathSpaceFunctionality(
    spg,
    struct,
    args[1] as string,
    args[2] as string,
    mergeSpaceId,
  );
  if (typeof addPathResult === "string") return addPathResult;
  addPathResult = await addPathSpaceFunctionality(
    spg,
    struct,
    args[3] as string,
    args[4] as string,
    mergeSpaceId,
  );
  if (typeof addPathResult === "string") return addPathResult;
  return mergeSpaceId;
};

export const createSelectionSpace = async (
  ...args: unknown[]
): Promise<string> => {
  const selectionSpaceId = await saveData(
    SPACE_SCHEMA,
    new SelectionSpace(
      false,
      args[3] as string,
      args[5] as string,
      "virtual",
      JSON.stringify({ x: 0, y: 0 }, jsonReplacer),
    ),
  );
  let addPathResult = await addPathSpace(args[0], args[1], selectionSpaceId);
  if (typeof addPathResult === "string") return addPathResult;
  const spg: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    args[0] as string,
  )) as SpacePathGraph;
  if (spg.structJSON === undefined) return SPG_ERROR.DNE;
  if (spg.final) return SPG_ERROR.IS_FINAL;
  const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
  addPathResult = await addPathSpaceFunctionality(
    spg,
    struct,
    selectionSpaceId,
    args[3] as string,
    args[2] as string,
  );
  if (typeof addPathResult === "string") return addPathResult;
  addPathResult = await addPathSpaceFunctionality(
    spg,
    struct,
    selectionSpaceId,
    args[5] as string,
    args[4] as string,
  );
  if (typeof addPathResult === "string") return addPathResult;
  return selectionSpaceId;
};

export const finalize = async (...args: unknown[]): Promise<string | void> => {
  const spg: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    args[0] as string,
  )) as SpacePathGraph;
  if (spg.structJSON === undefined) return SPG_ERROR.DNE;
  if (spg.final) return SPG_ERROR.IS_FINAL;
  const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
  const allPathIds = [].concat(...Array.from(struct.table.values()));
  await Promise.all(
    (await fetchAll(PATH_SCHEMA, allPathIds)).map(async (path: Path) => {
      path.reachable = await updateReachable(struct, path.target);
      await saveData(PATH_SCHEMA, path);
    }),
  );
  spg.final = true;
  await saveData(SPG_SCHEMA, spg);
};
