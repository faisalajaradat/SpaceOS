import { Entity, EntityId } from "redis-om";

import {
  ControlSpace,
  mapPathToPathLiteral,
  mapSpaceToSpaceLiteral,
  Path,
  PATH_SCHEMA,
  PathLiteral,
  Space,
  SPACE_SCHEMA,
  SpaceLiteral,
  SpacePathGraph,
  SpacePathGraphFactory,
  SPG_FACTORY_SCHEMA,
  SPG_SCHEMA,
  mapPathLiteralToPath,
  mapSpaceLiteralToSpace,
  MergeSpace,
  SelectionSpace,
} from "../../../SpatialComputingEngine/src/frontend-objects.js";
import {
  fetchAll,
  fetchData,
  saveData,
} from "../../../SpatialComputingEngine/src/spatial-computing-engine.js";
import {
  jsonReplacer,
  jsonReviver,
  SPGFactoryStruct,
  SPGStruct,
} from "./program.js";
import hash from "object-hash";

export async function intializeSPGFactory(
  spgId: string,
  primaryOutputSpaceId: string,
): Promise<string> {
  const templateSPG: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    spgId,
  )) as SpacePathGraph;
  const templateStruct: SPGStruct = JSON.parse(
    templateSPG.structJSON,
    jsonReviver,
  );
  const controlSpaces: Array<Space & ControlSpace> = [];
  const spaceMap = new Map<string, SpaceLiteral>();
  for await (const space of fetchAll(
    SPACE_SCHEMA,
    Array.from(templateStruct.table.keys()),
  ) as AsyncGenerator<Space>) {
    if (space._type === "SelectionSpace")
      controlSpaces.push(space as Space & ControlSpace);
    const spaceLiteral = await mapSpaceToSpaceLiteral(space);
    const spaceId = (space as Entity)[EntityId];
    if (spaceId === primaryOutputSpaceId) spaceLiteral.isPrimaryOutput = true;
    spaceMap.set(spaceId, spaceLiteral);
  }
  const pathMap: Map<string, PathLiteral> = new Map();
  for (const controlSpace of controlSpaces) {
    const controlSpaceLiteral = spaceMap.get(
      (controlSpace as Entity)[EntityId],
    );
    controlSpaceLiteral.selectionTruePath = mapPathToPathLiteral(
      (await fetchData(PATH_SCHEMA, controlSpace.truePath)) as Path,
      spaceMap,
    );
    controlSpaceLiteral.selectionFalsePath = mapPathToPathLiteral(
      (await fetchData(PATH_SCHEMA, controlSpace.falsePath)) as Path,
      spaceMap,
    );
    pathMap.set(controlSpace.truePath, controlSpaceLiteral.selectionTruePath);
    pathMap.set(controlSpace.falsePath, controlSpaceLiteral.selectionFalsePath);
  }
  const factoryTable = new Map<SpaceLiteral, PathLiteral[]>();
  for (const [spaceId, pathIds] of Array.from(templateStruct.table.entries())) {
    const paths = new Array<Path>();
    for await (const path of fetchAll(
      PATH_SCHEMA,
      pathIds,
    ) as AsyncGenerator<Path>) {
      paths.push(path);
      if (spaceMap.get(path.target)._type !== "MergeSpace") continue;
      const mergeSpace = (await fetchData(
        SPACE_SCHEMA,
        path.target,
      )) as MergeSpace;
      if (mergeSpace.truePath === (path as Entity)[EntityId])
        spaceMap.get((mergeSpace as Entity)[EntityId]).mergeTrueSpace =
          spaceMap.get(spaceId);
      if (mergeSpace.falsePath === (path as Entity)[EntityId])
        spaceMap.get((mergeSpace as Entity)[EntityId]).mergeFalseSpace =
          spaceMap.get(spaceId);
    }
    factoryTable.set(
      spaceMap.get(spaceId),
      paths.map((path: Path) =>
        pathMap.has((path as Entity)[EntityId])
          ? pathMap.get((path as Entity)[EntityId])
          : mapPathToPathLiteral(path, spaceMap),
      ),
    );
  }

  const factoryStruct: SPGFactoryStruct = {
    root: spaceMap.get(templateStruct.root),
    table: factoryTable,
  };
  return await saveData(
    SPG_FACTORY_SCHEMA,
    new SpacePathGraphFactory(JSON.stringify(factoryStruct, jsonReplacer, 4)),
  );
}

export const createSPG = async (...args: unknown[]): Promise<string> => {
  let factory: SpacePathGraphFactory = (await fetchData(
    SPG_FACTORY_SCHEMA,
    args[0] as string,
  )) as SpacePathGraphFactory;
  if (factory === undefined) return "Factory does not exist!";
  const factoryStruct: SPGFactoryStruct = JSON.parse(
    factory.SPGFactoryStructJSON,
    jsonReviver,
  );
  const selectionSpaceLiterals: Array<SpaceLiteral> = [];
  const spaceMap: Map<string, string> = new Map<string, string>();
  for (const spaceLiteral of factoryStruct.table.keys()) {
    if (spaceLiteral._type === "SelectionSpace")
      selectionSpaceLiterals.push(spaceLiteral);
    const spaceId = await saveData(
      SPACE_SCHEMA,
      mapSpaceLiteralToSpace(spaceLiteral),
    );
    if (spaceLiteral.isPrimaryOutput) {
      factory.primaryOutputSpaceId = spaceId;
      factory = (await fetchData(
        SPG_FACTORY_SCHEMA,
        await saveData(SPG_FACTORY_SCHEMA, factory),
      )) as SpacePathGraphFactory;
    }
    spaceMap.set(hash(spaceLiteral), spaceId);
  }
  const pathMap: Map<string, string> = new Map<string, string>();
  for (const selectionSpaceLiteral of selectionSpaceLiterals) {
    const selectionSpace = (await fetchData(
      SPACE_SCHEMA,
      spaceMap.get(hash(selectionSpaceLiteral)),
    )) as SelectionSpace;
    selectionSpace.truePath = await saveData(
      PATH_SCHEMA,
      mapPathLiteralToPath(
        selectionSpaceLiteral.selectionTruePath,
        spaceMap,
        hash,
      ),
    );
    selectionSpace.falsePath = await saveData(
      PATH_SCHEMA,
      mapPathLiteralToPath(
        selectionSpaceLiteral.selectionFalsePath,
        spaceMap,
        hash,
      ),
    );
    await saveData(SPACE_SCHEMA, selectionSpace);
    pathMap.set(
      hash(selectionSpaceLiteral.selectionTruePath),
      selectionSpace.truePath,
    );
    pathMap.set(
      hash(selectionSpaceLiteral.selectionFalsePath),
      selectionSpace.falsePath,
    );
  }
  const structTable = new Map<string, string[]>();
  for (const [spaceLiteral, pathLiterals] of factoryStruct.table.entries()) {
    for (const pathLiteral of pathLiterals) {
      if (pathLiteral.target._type !== "MergeSpace") continue;
      const mergeSpace = (await fetchData(
        SPACE_SCHEMA,
        spaceMap.get(hash(pathLiteral.target)),
      )) as MergeSpace;
      if (
        spaceMap.get(hash(pathLiteral.target.mergeTrueSpace)) ===
        spaceMap.get(hash(spaceLiteral))
      ) {
        mergeSpace.truePath = await saveData(
          PATH_SCHEMA,
          mapPathLiteralToPath(pathLiteral, spaceMap, hash),
        );
        pathMap.set(hash(pathLiteral), mergeSpace.truePath);
      }
      if (
        spaceMap.get(hash(pathLiteral.target.mergeFalseSpace)) ===
        spaceMap.get(hash(spaceLiteral))
      ) {
        mergeSpace.falsePath = await saveData(
          PATH_SCHEMA,
          mapPathLiteralToPath(pathLiteral, spaceMap, hash),
        );
        pathMap.set(hash(pathLiteral), mergeSpace.falsePath);
      }
      await saveData(SPACE_SCHEMA, mergeSpace);
    }
    const pathIds = new Array<string>();
    for (const pathLiteral of pathLiterals)
      pathIds.push(
        pathMap.has(hash(pathLiteral))
          ? pathMap.get(hash(pathLiteral))
          : await saveData(
              PATH_SCHEMA,
              mapPathLiteralToPath(pathLiteral, spaceMap, hash),
            ),
      );
    structTable.set(spaceMap.get(hash(spaceLiteral)), pathIds);
  }
  const struct: SPGStruct = {
    root: spaceMap.get(hash(factoryStruct.root)),
    table: structTable,
  };
  return await saveData(
    SPG_SCHEMA,
    new SpacePathGraph(JSON.stringify(struct, jsonReplacer, 4)),
  );
};

export const getFactoryJSON = async (...args: unknown[]): Promise<string> =>
  (
    (await fetchData(
      SPG_FACTORY_SCHEMA,
      args[0] as string,
    )) as SpacePathGraphFactory
  ).SPGFactoryStructJSON ?? "Factory does not exist!";
