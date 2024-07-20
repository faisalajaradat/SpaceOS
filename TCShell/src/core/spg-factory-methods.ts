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

export async function intializeSPGFactory(spgId: string): Promise<string> {
  const templateSPG: SpacePathGraph = (await fetchData(
    SPG_SCHEMA,
    spgId,
  )) as SpacePathGraph;
  const templateStruct: SPGStruct = JSON.parse(
    templateSPG.structJSON,
    jsonReviver,
  );
  const controlSpaces: Array<Space & ControlSpace> = [];
  const spaceMap: Map<string, SpaceLiteral> = new Map<string, SpaceLiteral>(
    await Promise.all(
      (
        await fetchAll(SPACE_SCHEMA, Array.from(templateStruct.table.keys()))
      ).map(async (space: Space) => {
        if (space._type === "SelectionSpace")
          controlSpaces.push(space as Space & ControlSpace);
        return [
          (space as Entity)[EntityId],
          await mapSpaceToSpaceLiteral(space),
        ] as [string, SpaceLiteral];
      }),
    ),
  );
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
  const factoryTable = new Map(
    await Promise.all(
      Array.from(templateStruct.table.entries()).map(
        async ([spaceId, pathIds]) => {
          const paths = (await fetchAll(PATH_SCHEMA, pathIds)) as Path[];
          await Promise.all(
            paths
              .filter(
                (path) => spaceMap.get(path.target)._type === "MergeSpace",
              )
              .map(async (path) => {
                const mergeSpace = (await fetchData(
                  SPACE_SCHEMA,
                  path.target,
                )) as MergeSpace;
                if (mergeSpace.truePath === (path as Entity)[EntityId])
                  spaceMap.get(
                    (mergeSpace as Entity)[EntityId],
                  ).mergeTrueSpace = spaceMap.get(spaceId);
                if (mergeSpace.falsePath === (path as Entity)[EntityId])
                  spaceMap.get(
                    (mergeSpace as Entity)[EntityId],
                  ).mergeFalseSpace = spaceMap.get(spaceId);
              }),
          );
          return [
            spaceMap.get(spaceId),
            paths.map((path: Path) =>
              pathMap.has((path as Entity)[EntityId])
                ? pathMap.get((path as Entity)[EntityId])
                : mapPathToPathLiteral(path, spaceMap),
            ),
          ] as [SpaceLiteral, PathLiteral[]];
        },
      ),
    ),
  );

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
  const factory: SpacePathGraphFactory = (await fetchData(
    SPG_FACTORY_SCHEMA,
    args[0] as string,
  )) as SpacePathGraphFactory;
  if (factory === undefined) return "Factory does not exist!";
  const factoryStruct: SPGFactoryStruct = JSON.parse(
    factory.SPGFactoryStructJSON,
    jsonReviver,
  );
  const selectionSpaceLiterals: Array<SpaceLiteral> = [];
  const spaceMap: Map<string, string> = new Map<string, string>(
    await Promise.all(
      Array.from(factoryStruct.table.keys()).map(async (spaceLiteral) => {
        if (spaceLiteral._type === "SelectionSpace")
          selectionSpaceLiterals.push(spaceLiteral);
        return [
          hash(spaceLiteral),
          await saveData(SPACE_SCHEMA, mapSpaceLiteralToSpace(spaceLiteral)),
        ] as [string, string];
      }),
    ),
  );
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
  const structTable = new Map(
    await Promise.all(
      Array.from(factoryStruct.table.entries()).map(
        async ([spaceLiteral, pathLiterals]) => {
          await Promise.all(
            pathLiterals
              .filter(
                (pathLiteral) => pathLiteral.target._type === "MergeSpace",
              )
              .map(async (pathLiteral) => {
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
              }),
          );
          return [
            spaceMap.get(hash(spaceLiteral)),
            await Promise.all(
              pathLiterals.map(async (pathLiteral) =>
                pathMap.has(hash(pathLiteral))
                  ? pathMap.get(hash(pathLiteral))
                  : await saveData(
                      PATH_SCHEMA,
                      mapPathLiteralToPath(pathLiteral, spaceMap, hash),
                    ),
              ),
            ),
          ] as [string, string[]];
        },
      ),
    ),
  );
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
