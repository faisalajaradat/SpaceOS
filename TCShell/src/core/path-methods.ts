import {
  mapPathLiteralToPath,
  mapSpaceLiteralToSpace,
  MergeSpace,
  Path,
  PATH_SCHEMA,
  SelectionSpace,
  SPACE_SCHEMA,
  SpaceLiteral,
  SpacePathGraph,
  SpacePathGraphFactory,
  SPG_FACTORY_SCHEMA,
  SPG_SCHEMA,
} from "../../../SpatialComputingEngine/src/frontend-objects.js";
import {
  fetchData,
  saveData,
} from "../../../SpatialComputingEngine/src/spatial-computing-engine.js";
import {
  jsonReplacer,
  jsonReviver,
  SPGFactoryStruct,
  SPGStruct,
} from "./program.js";
import oh from "object-hash";
const { hash } = oh;

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

export const createSPG = async (...args: unknown[]): Promise<string> => {
  const path: Path = (await fetchData(PATH_SCHEMA, args[0] as string)) as Path;
  if (path.factory === undefined) return "Path does not have a factory!";
  const factory: SpacePathGraphFactory = (await fetchData(
    SPG_FACTORY_SCHEMA,
    path.factory,
  )) as SpacePathGraphFactory;
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
              }),
          );
          return [
            spaceMap.get(hash(spaceLiteral)),
            await Promise.all(
              pathLiterals.map(async (pathLiteral) =>
                pathMap.has(hash(pathLiteral))
                  ? pathMap.get(hash(pathLiteral))
                  : await mapPathLiteralToPath(pathLiteral, spaceMap, hash),
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
