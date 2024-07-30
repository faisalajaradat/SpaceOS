import { splitPath } from "../../../../TCShell/src/core/spg-methods.js";


export default function tscSplitPath(SPG_id:string, path_to_split_id:string){
    return splitPath(SPG_id, path_to_split_id);
}

/* splitPath(SPG_id: string, path_to_split_id: string)


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
*/