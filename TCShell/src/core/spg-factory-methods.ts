import { Entity, EntityId } from "redis-om";

import {
  ControlSpace,
  mapPathToPathLiteral,
  mapSpaceToSpaceLiteral,
  MergeSpace,
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
