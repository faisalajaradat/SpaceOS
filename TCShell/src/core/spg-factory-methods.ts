import { Entity, EntityId } from "redis-om";
import {
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
  const spaceMap: Map<string, SpaceLiteral> = new Map<string, SpaceLiteral>(
    await Promise.all(
      (
        await fetchAll(SPACE_SCHEMA, Array.from(templateStruct.table.keys()))
      ).map(
        async (space: Space) =>
          [
            (space as Entity)[EntityId],
            await mapSpaceToSpaceLiteral(space),
          ] as [string, SpaceLiteral],
      ),
    ),
  );
  const factoryStruct: SPGFactoryStruct = {
    root: spaceMap.get(templateStruct.root),
    table: new Map(
      await Promise.all(
        Array.from(templateStruct.table.entries()).map(
          async ([spaceId, pathIds]) =>
            [
              spaceMap.get(spaceId),
              (await fetchAll(PATH_SCHEMA, pathIds)).map((path: Path) =>
                mapPathToPathLiteral(path, spaceMap),
              ),
            ] as [SpaceLiteral, PathLiteral[]],
        ),
      ),
    ),
  };
  return await saveData(
    SPG_FACTORY_SCHEMA,
    new SpacePathGraphFactory(JSON.stringify(factoryStruct, jsonReplacer, 4)),
  );
}

export const createSPG = async (...args: unknown[]): Promise<string> => {};
