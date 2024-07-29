import { Entity, EntityId } from "redis-om";
import {
  connectAndGetRepo,
  fetchAll,
  fetchData,
  isControlSpace,
  Location,
  LOCATION_SCHEMA,
  MergeSpace,
  OpenSpace,
  Path,
  PATH_SCHEMA,
  saveData,
  SelectionSpace,
  Space,
  SPACE_SCHEMA,
  SpacePathGraph,
  SpacePathGraphFactory,
  SPG_FACTORY_SCHEMA,
  SPG_SCHEMA,
} from "../../../SpatialComputingEngine/src/index.js";
import {
  JourneyNode,
  jsonReplacer,
  jsonReviver,
  SPGStruct,
} from "./program.js";
import { receiveEntity, sendEntity } from "./space-methods.js";
import { createSPG } from "./spg-factory-methods.js";

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
    for await (const path of fetchAll(
      PATH_SCHEMA,
      struct.table.get(curSpace),
    ) as AsyncGenerator<Path>) {
      if (!visited.has(path.target)) stack.push(path.target);
    }
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
    for await (const path of fetchAll(
      PATH_SCHEMA,
      struct.table.get(nextSpace.spaceId),
    ) as AsyncGenerator<Path>) {
      if (!path.reachable.includes(end) || explored.has(path.target)) continue;
      explored.add(path.target);
      queue.push({ parent: nextSpace, spaceId: path.target });
    }
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
  path.reachable.push(path.target);
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
  spg.final = false;
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

const updateSegmentCounts = async (originalPath: Path) => {
  const paths = (await (await connectAndGetRepo(PATH_SCHEMA))
    .search()
    .where("name")
    .equals(originalPath.name)
    .and("segment")
    .greaterThan(originalPath.segment)
    .returnAll()) as Path[];
  for (const path of paths) {
    path.segment = path.segment + 1;
    await saveData(PATH_SCHEMA, path);
  }
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
  if (originalPath._type === undefined) return "Path does not exist!";
  if (spg.structJSON === undefined) return SPG_ERROR.DNE;
  if (originalPath.target === undefined || originalPath.reachable.length < 1)
    return "Path is not in SPG!";
  spg.final = false;
  await updateSegmentCounts(originalPath);
  const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
  const endSpace = originalPath.target;
  const intermediateSpaceLocation = await saveData(
    LOCATION_SCHEMA,
    new Location({ x: 0, y: 0 }),
  );
  const intermediateSpace = new OpenSpace(
    "virtual",
    true,
    intermediateSpaceLocation,
  );
  const intermediateSpaceId = await saveData(SPACE_SCHEMA, intermediateSpace);
  const newPath = new Path(
    originalPath.locality,
    originalPath.name,
    originalPath.segment + 1,
  );
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
  originalPath.reachable = await updateReachable(struct, originalPath.target);
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
    if (journeyEndNode === undefined) return "Cannot reach end location!";
    journeyStack.push(journeyEndNode.spaceId);
    journeyEndNode = journeyEndNode.parent;
  }
  while (journeyStack.length > 1) {
    const curSpaceId = journeyStack.pop();
    const targetSpaceId = journeyStack.at(-1);
    const reachablePathIds = new Array<string>();
    for await (const path of fetchAll(
      PATH_SCHEMA,
      struct.table.get(curSpaceId),
    ) as AsyncGenerator<Path>) {
      if (path.reachable.includes(targetSpaceId))
        reachablePathIds.push((path as Entity)[EntityId]);
    }
    const pathId = reachablePathIds[0];
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
  spg.final = false;
  const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
  const mergeSpaceId = await saveData(
    SPACE_SCHEMA,
    new MergeSpace(
      false,
      args[2] as string,
      args[4] as string,
      "virtual",
      await saveData(LOCATION_SCHEMA, new Location({ x: 0, y: 0 })),
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
      await saveData(LOCATION_SCHEMA, new Location({ x: 0, y: 0 })),
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
  for await (const path of fetchAll(
    PATH_SCHEMA,
    allPathIds,
  ) as AsyncGenerator<Path>) {
    path.reachable = await updateReachable(struct, path.target);
    await saveData(PATH_SCHEMA, path);
  }
  spg.final = true;
  await saveData(SPG_SCHEMA, spg);
};

export const activateFactories = async (
  ...args: unknown[]
): Promise<string | [string[], string[]]> => {
  let spg: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    args[0] as string,
  )) as SpacePathGraph;
  if (spg.structJSON === undefined) return SPG_ERROR.DNE;
  spg.final = false;
  let struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
  const allPathIds = [].concat(...Array.from(struct.table.values()));
  const unhandledIOSpaces: [string[], string[]] = [[], []];
  for await (const factoryPath of fetchAll(
    PATH_SCHEMA,
    allPathIds,
  ) as AsyncGenerator<Path>) {
    if (factoryPath.factory === undefined) continue;
    const factoryPathSegmentId = await splitPath(
      args[0] as string,
      (factoryPath as Entity)[EntityId],
    );
    spg = (await fetchData(SPG_SCHEMA, args[0] as string)) as SpacePathGraph;
    struct = JSON.parse(spg.structJSON, jsonReviver);
    const factoryPathSegment = (await fetchData(
      PATH_SCHEMA,
      factoryPathSegmentId,
    )) as Path;
    const factoryPathUpdated = (await fetchData(
      PATH_SCHEMA,
      (factoryPath as Entity)[EntityId],
    )) as Path;
    const generatedSPG = (await fetchData(
      SPG_SCHEMA,
      await createSPG(factoryPathUpdated.factory),
    )) as SpacePathGraph;
    const primaryOutputSpaceId = (
      (await fetchData(
        SPG_FACTORY_SCHEMA,
        factoryPathUpdated.factory,
      )) as SpacePathGraphFactory
    ).primaryOutputSpaceId;
    const generatedStruct: SPGStruct = JSON.parse(
      generatedSPG.structJSON,
      jsonReviver,
    );
    struct.table = new Map([...struct.table, ...generatedStruct.table]);
    spg.structJSON = JSON.stringify(struct, jsonReplacer, 4);
    await saveData(SPG_SCHEMA, spg);
    const reachableSpacesSet = new Set<string>();
    reachableSpacesSet.add(generatedStruct.root);
    const allSpaceSet = new Set<string>();
    for (const [spaceId, pathIds] of generatedStruct.table.entries()) {
      allSpaceSet.add(spaceId);
      if (pathIds.length > 0) {
        for await (const path of fetchAll(
          PATH_SCHEMA,
          pathIds,
        ) as AsyncGenerator<Path>)
          path.reachable.forEach(reachableSpacesSet.add, reachableSpacesSet);
        continue;
      }
      if (spaceId !== primaryOutputSpaceId) {
        unhandledIOSpaces[1].push(spaceId);
        continue;
      }
      await updateSegmentCounts(factoryPathUpdated);
      const newPathId = await saveData(
        PATH_SCHEMA,
        new Path(
          factoryPathSegment.locality,
          factoryPathSegment.name,
          factoryPath.segment + 1,
        ),
      );
      await addPathSpaceFunctionality(
        spg,
        struct,
        spaceId,
        newPathId,
        factoryPathUpdated.target,
      );
    }
    unhandledIOSpaces[0].push(
      ...[...allSpaceSet].filter((x) => !reachableSpacesSet.has(x)),
    );
    factoryPathUpdated.target = generatedStruct.root;
    factoryPathUpdated.reachable.push(generatedStruct.root);
    await saveData(PATH_SCHEMA, factoryPathUpdated);
    generatedSPG.final = true;
    await saveData(SPG_SCHEMA, generatedSPG);
    spg = (await fetchData(SPG_SCHEMA, args[0] as string)) as SpacePathGraph;
    struct = JSON.parse(spg.structJSON, jsonReviver);
  }
  await saveData(SPG_SCHEMA, spg);
  return unhandledIOSpaces;
};
