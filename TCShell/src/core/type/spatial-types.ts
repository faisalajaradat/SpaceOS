import {
  ASTNode,
  dotString,
  JourneyNode,
  jsonReplacer,
  jsonReviver,
  newNodeId,
  SPGStruct,
} from "../program.js";
import {
  ArrayType,
  CompositionType,
  DefaultBaseTypeInstance,
  FunctionType,
  Type,
} from "./primitive-types.js";
import { isAnyType, isDecorator } from "../../utils.js";
import * as engine from "../../../../SpatialComputingEngine/src/frontend-objects.js";
import {
  connectAndGetRepo,
  fetchData,
  saveData,
} from "../../../../SpatialComputingEngine/src/spatial-computing-engine.js";
import { UnionType } from "./UnionType.js";
import { Identifier } from "../expr/Expr.js";
import { libDeclarations } from "../stmts.js";
import { Entity, EntityId } from "redis-om";

export class SpatialType extends CompositionType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const spatialTypeNodeId = newNodeId();
    dotString.push(spatialTypeNodeId + '[label=" Spatial Type "];\n');
    return spatialTypeNodeId;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        !(
          isDecorator(_type) ||
          _type instanceof SpatialObjectType ||
          _type instanceof PathType
        ))
    );
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SpatialType;
  }
}

export interface SpatialTypeDecorator extends SpatialType {
  delegate: SpatialType;
}

export abstract class LocalityDecorator
  extends SpatialType
  implements SpatialTypeDecorator
{
  delegate: SpatialType;

  constructor(delegate: SpatialType, line: number = -1, column: number = -1) {
    super(line, column);
    this.delegate = delegate;
  }
}

export class PhysicalDecorator extends LocalityDecorator {
  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const physicalNodeId = newNodeId();
    dotString.push(physicalNodeId + '[label=" Physical "];\n');
    const delegateNodeId = this.delegate.print();
    dotString.push(physicalNodeId + "->" + delegateNodeId + ";\n");
    return physicalNodeId;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        this.delegate.equals((<PhysicalDecorator>_type).delegate))
    );
  }

  contains(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof PhysicalDecorator &&
        this.delegate.contains(_type.delegate))
    );
  }
}

export class VirtualDecorator extends LocalityDecorator {
  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const virtualNodeId = newNodeId();
    dotString.push(virtualNodeId + '[label=" Virtual "];\n');
    const delegateNodeId = this.delegate.print();
    dotString.push(virtualNodeId + "->" + delegateNodeId + ";\n");
    return virtualNodeId;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        this.delegate.equals((<VirtualDecorator>_type).delegate))
    );
  }

  contains(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof VirtualDecorator &&
        this.delegate.contains(_type.delegate))
    );
  }
}

export class PathType extends SpatialType {
  static libMethods: Map<string, (...args: unknown[]) => Promise<unknown>>;

  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  static {
    PathType.libMethods = new Map<
      string,
      (...args: unknown[]) => Promise<unknown>
    >();
    PathType.libMethods.set("getReachableSpaces", async (...args) => {
      const path: engine.Path = (await fetchData(
        engine.PATH_SCHEMA,
        args[0] as string,
      )) as engine.Path;
      return path.reachable;
    });
  }

  static mapMethodNameToMethodType(methodName): FunctionType {
    switch (methodName) {
      case "getReachableSpaces":
        return new FunctionType(new ArrayType(new SpaceType()), []);
    }
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const pathNodeId = newNodeId();
    dotString.push(pathNodeId + '[label=" Path "];\n');
    return pathNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof PathType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}
export class LandPathType extends PathType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const landPathNodeId = newNodeId();
    dotString.push(landPathNodeId + '[label=" Land Path "];\n');
    return landPathNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof LandPathType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class AirPathType extends PathType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const airPathNodeId = newNodeId();
    dotString.push(airPathNodeId + '[label=" Air Path "];\n');
    return airPathNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof AirPathType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export abstract class SpatialObjectType extends SpatialType {}

export abstract class ControlDecorator
  extends SpatialObjectType
  implements SpatialTypeDecorator
{
  delegate: SpatialObjectType;

  constructor(
    delegate: SpatialObjectType,
    line: number = -1,
    column: number = -1,
  ) {
    super(line, column);
    this.delegate = delegate;
  }
}

export class ControlledDecorator extends ControlDecorator {
  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const controlledNodeId = newNodeId();
    dotString.push(controlledNodeId + '[label=" Controlled "];\n');
    const delegateNodeId = this.delegate.print();
    dotString.push(controlledNodeId + "->" + delegateNodeId + ";\n");
    return controlledNodeId;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        this.delegate.equals((<ControlledDecorator>_type).delegate))
    );
  }

  contains(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof ControlledDecorator &&
        this.delegate.contains(_type.delegate))
    );
  }
}

export class NotControlledDecorator extends ControlDecorator {
  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const notControlledNodeId = newNodeId();
    dotString.push(notControlledNodeId + '[label=" Not Controlled "];\n');
    const delegateNodeId = this.delegate.print();
    dotString.push(notControlledNodeId + "->" + delegateNodeId + ";\n");
    return notControlledNodeId;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        this.delegate.equals((<NotControlledDecorator>_type).delegate))
    );
  }

  contains(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof NotControlledDecorator &&
        this.delegate.contains(_type.delegate))
    );
  }
}

export class SpaceType extends SpatialObjectType {
  static libMethods: Map<string, (...args: unknown[]) => Promise<unknown>>;
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  static {
    SpaceType.libMethods = new Map<
      string,
      (...args: unknown[]) => Promise<unknown>
    >();
    SpaceType.libMethods.set(
      "addEntities",
      async (...args): Promise<string | void> => {
        const space: engine.Space = (await fetchData(
          engine.SPACE_SCHEMA,
          args[0] as string,
        )) as engine.Space;
        if (
          (
            await Promise.all(
              space.entities.map(
                async (entityId) =>
                  (await fetchData(
                    engine.ENTITY_SCHEMA,
                    entityId,
                  )) as engine.SpatialEntity,
              ),
            )
          ).filter(
            (entity) =>
              entity.locality !== space.locality ||
              entity.isControlled !== space.isControlled,
          ).length > 0
        )
          return "Input entities are not all compatible with space";
        space.entities.push(...(args[1] as string[]));
        await saveData(engine.SPACE_SCHEMA, space);
      },
    );
    SpaceType.libMethods.set(
      "getEntities",
      async (...args): Promise<string[]> => {
        const space: engine.Space = (await fetchData(
          engine.SPACE_SCHEMA,
          args[0] as string,
        )) as engine.Space;
        return space.entities;
      },
    );
    SpaceType.libMethods.set(
      "sendEntity",
      async (...args): Promise<string | void> => {
        const space: engine.Space = (await fetchData(
          engine.SPACE_SCHEMA,
          args[0] as string,
        )) as engine.Space;
        if (
          space.entities === undefined ||
          !space.entities.includes(args[1] as string)
        )
          return "Space does not contain inputted entity!";
        const entityIndex = space.entities.indexOf(args[1] as string);
        if (engine.isControlSpace(space)) {
          if (
            space._type === "MergeSpace" &&
            ((entityIndex === 0 && !space.controlSignal) ||
              (entityIndex === 1 && space.controlSignal))
          )
            return "Entity blocked by control signal!";
          if (
            space._type === "SelectionSpace" &&
            (((args[2] as string) === space.truePath && !space.controlSignal) ||
              ((args[2] as string) === space.falsePath && space.controlSignal))
          )
            return "Path blocked by control signal!";
        }
        let message: engine.SendEntityRequestMessage =
          new engine.SendEntityRequestMessage(
            args[0] as string,
            args[1] as string,
            args[2] as string,
          );
        const msgId = await saveData(engine.SEND_ENTITY_SCHEMA, message);
        while (message.status !== "PROCESSED") {
          await new Promise((r) => setTimeout(r, args[3] as number));
          message = (await fetchData(
            engine.SEND_ENTITY_SCHEMA,
            msgId,
          )) as engine.SendEntityRequestMessage;
          if (message.status === "ERROR") return message.errorMsg as string;
        }
      },
    );
    SpaceType.libMethods.set(
      "receiveEntity",
      async (...args): Promise<string | void> => {
        let space: engine.Space = (await fetchData(
          engine.SPACE_SCHEMA,
          args[0] as string,
        )) as engine.Space;
        if (space.entities === undefined) return "Space cannot be found!";
        if (space.entities.includes(args[1] as string))
          return "Space already contains entity!";
        let message: engine.EnterSpaceRequestMessage = (await (
          await connectAndGetRepo(engine.ENTER_SPACE_SCHEMA)
        )
          .search()
          .where("space")
          .equals(args[0] as string)
          .and("entity")
          .equals(args[1] as string)
          .and((search) =>
            search
              .where("status")
              .not.equals("ACCEPTED")
              .and("status")
              .not.equals("DENIED"),
          )
          .sortAscending("timestamp")
          .return.first()) as engine.EnterSpaceRequestMessage;
        if (message === null) return "Entity is not attempting to enter space!";
        while (message.status !== "ARRIVED") {
          if (message.status === "ERROR") {
            message.status = "DECLINED";
            message.timestamp = new Date(Date.now());
            await saveData(engine.ENTER_SPACE_SCHEMA, message);
            return message.errorMsg;
          }
          await new Promise((r) => setTimeout(r, args[2] as number));
          message = (await fetchData(
            engine.ENTER_SPACE_SCHEMA,
            (message as Entity)[EntityId],
          )) as engine.EnterSpaceRequestMessage;
        }
        space = (await fetchData(
          engine.SPACE_SCHEMA,
          args[0] as string,
        )) as engine.Space;
        if (engine.isControlSpace(space) && space._type === "MergeSpace") {
          if (message.path === space.truePath) {
            if (space.entities[0] === "") space.entities[0] = message.entity;
            else return "Merge space true input is already full!";
          }
          if (message.path === space.falsePath) {
            if (space.entities[1] === "") space.entities[1] = message.entity;
            else return "Merge space false input is already full!";
          }
        } else space.entities.push(message.entity);
        await saveData(engine.SPACE_SCHEMA, space);
        message.status = "ACCEPTED";
        message.timestamp = new Date(Date.now());
        await saveData(engine.ENTER_SPACE_SCHEMA, message);
        const path: engine.Path = (await fetchData(
          engine.PATH_SCHEMA,
          message.path,
        )) as engine.Path;
        path.isFull = false;
        await saveData(engine.PATH_SCHEMA, path);
      },
    );
  }

  static mapMethodNameToMethodType(methodName: string): FunctionType {
    const maybeStringType = new UnionType(new Identifier("MaybeString"));
    maybeStringType.identifier.declaration = libDeclarations[1];
    switch (methodName) {
      case "addEntities":
        return new FunctionType(maybeStringType, [
          new ArrayType(new EntityType()),
        ]);
      case "getEntities":
        return new FunctionType(new ArrayType(new EntityType()), []);
      case "sendEntity":
        return new FunctionType(maybeStringType, [
          new EntityType(),
          new PathType(),
          DefaultBaseTypeInstance.NUMBER,
        ]);
      case "receiveEntity":
        return new FunctionType(maybeStringType, [
          new EntityType(),
          DefaultBaseTypeInstance.NUMBER,
        ]);
    }
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const spaceNodeId = newNodeId();
    dotString.push(spaceNodeId + '[label=" Space "];\n');
    return spaceNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SpaceType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class OpenSpaceType extends SpaceType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const openSpaceNodeId = newNodeId();
    dotString.push(openSpaceNodeId + '[label=" Open Space "];\n');
    return openSpaceNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof OpenSpaceType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class EnclosedSpaceType extends SpaceType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const enclosedSpaceNodeId = newNodeId();
    dotString.push(enclosedSpaceNodeId + '[label=" Enclosed Space "];\n');
    return enclosedSpaceNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof EnclosedSpaceType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class EntityType extends SpatialObjectType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const entityNodeId = newNodeId();
    dotString.push(entityNodeId + '[label=" Entity "];\n');
    return entityNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof EntityType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class StaticEntityType extends EntityType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const staticEntityNodeId = newNodeId();
    dotString.push(staticEntityNodeId + '[label=" Static Entity "];\n');
    return staticEntityNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof StaticEntityType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class DynamicEntityType extends EntityType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const dynamicEntityNodeId = newNodeId();
    dotString.push(dynamicEntityNodeId + '[label=" Dynamic Entity "];\n');
    return dynamicEntityNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof DynamicEntityType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class AnimateEntityType extends DynamicEntityType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const animateEntityNodeId = newNodeId();
    dotString.push(animateEntityNodeId + '[label=" Animate Entity "];\n');
    return animateEntityNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof AnimateEntityType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class SmartEntityType extends DynamicEntityType {
  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const smartEntityNodeId = newNodeId();
    dotString.push(smartEntityNodeId + '[label=" Smart Entity "];\n');
    return smartEntityNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SmartEntityType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export abstract class MotionDecorator
  extends DynamicEntityType
  implements SpatialTypeDecorator
{
  delegate: DynamicEntityType;

  constructor(
    delegate: DynamicEntityType,
    line: number = -1,
    column: number = -1,
  ) {
    super(line, column);
    this.delegate = delegate;
  }
}

export class MobileDecorator extends MotionDecorator {
  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const mobileNodeId = newNodeId();
    dotString.push(mobileNodeId + '[label=" Mobile "];\n');
    const delegateNodeId = this.delegate.print();
    dotString.push(mobileNodeId + "->" + delegateNodeId + ";\n");
    return mobileNodeId;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        this.delegate.equals((<MobileDecorator>_type).delegate))
    );
  }

  contains(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof MobileDecorator &&
        this.delegate.contains(_type.delegate))
    );
  }
}

export class StationaryDecorator extends MotionDecorator {
  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const stationaryNodeId = newNodeId();
    dotString.push(stationaryNodeId + '[label=" Stationary "];\n');
    const delegateNodeId = this.delegate.print();
    dotString.push(stationaryNodeId + "->" + delegateNodeId + ";\n");
    return stationaryNodeId;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        this.delegate.equals((<StationaryDecorator>_type).delegate))
    );
  }

  contains(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (_type instanceof StationaryDecorator &&
        this.delegate.contains(_type.delegate))
    );
  }
}

async function addPathSpaceFunctionality(
  spg: engine.SpacePathGraph,
  struct: SPGStruct,
  rootSpaceId: string,
  pathId: string,
  newSpaceId: string,
): Promise<void> {
  const rootNodePaths = struct.table.get(rootSpaceId);
  if (rootNodePaths !== undefined) rootNodePaths.push(pathId);
  else struct.table.set(rootSpaceId, [pathId]);
  if (!struct.table.has(newSpaceId)) struct.table.set(newSpaceId, []);
  spg.structJSON = JSON.stringify(struct, jsonReplacer, 4);
  await saveData(engine.SPG_SCHEMA, spg);
  const path = (await fetchData(engine.PATH_SCHEMA, pathId)) as engine.Path;
  path.target = newSpaceId;
  path.reachable = await updateReachable(struct, path.target);
  await saveData(engine.PATH_SCHEMA, path);
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
    (
      await Promise.all(
        struct.table
          .get(nextSpace.spaceId)
          .map(
            async (pathId) =>
              (await fetchData(engine.PATH_SCHEMA, pathId)) as engine.Path,
          ),
      )
    )
      .filter(
        (path) => path.reachable.includes(end) && !explored.has(path.target),
      )
      .forEach((path) => {
        explored.add(path.target);
        queue.push({ parent: nextSpace, spaceId: path.target });
      });
  }
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
      ...(
        await Promise.all(
          struct.table
            .get(curSpace)
            .map(
              async (pathId) =>
                (await fetchData(engine.PATH_SCHEMA, pathId)) as engine.Path,
            ),
        )
      )
        .map((path) => path.target)
        .filter((spaceId) => !visited.has(spaceId)),
    );
  }
  return Array.from(visited);
}

export class SpacePathGraphType extends SpatialType {
  static libMethods: Map<string, (...args: unknown[]) => Promise<unknown>>;

  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  static {
    this.libMethods = new Map<
      string,
      (...args: unknown[]) => Promise<unknown>
    >();
    SpacePathGraphType.libMethods.set("setRoot", async (...args) => {
      const spg: engine.SpacePathGraph = (await fetchData(
        engine.SPG_SCHEMA,
        args[0] as string,
      )) as engine.SpacePathGraph;
      const struct: SPGStruct = JSON.parse(
        spg.structJSON,
        jsonReviver,
      ) as SPGStruct;
      if (!struct.table.has(args[1] as string))
        return "Cannot delegate root to space not in graph!";
      struct.root = args[1] as string;
      spg.structJSON = JSON.stringify(struct, jsonReplacer, 4);
      await saveData(engine.SPG_SCHEMA, spg);
    });
    SpacePathGraphType.libMethods.set("addPathSpace", async (...args) => {
      const spg: engine.SpacePathGraph = (await fetchData(
        engine.SPG_SCHEMA,
        args[0] as string,
      )) as engine.SpacePathGraph;
      const struct: SPGStruct = JSON.parse(
        spg.structJSON,
        jsonReviver,
      ) as SPGStruct;
      const rootSpace: engine.Space = (await fetchData(
        engine.SPACE_SCHEMA,
        struct.root,
      )) as engine.Space;
      if (rootSpace.innerSpace === (args[2] as string))
        return "Cannot path root space to its inner space!";
      if (
        engine.isControlSpace(rootSpace) &&
        rootSpace._type === "SelectionSpace"
      )
        return "Cannot extend selection space!";

      await addPathSpaceFunctionality(
        spg,
        struct,
        struct.root,
        args[1] as string,
        args[2] as string,
      );
    });
    SpacePathGraphType.libMethods.set("splitPath", async (...args) => {
      const spg: engine.SpacePathGraph = (await fetchData(
        engine.SPG_SCHEMA,
        args[0] as string,
      )) as engine.SpacePathGraph;
      const originalPath: engine.Path = (await fetchData(
        engine.PATH_SCHEMA,
        args[1] as string,
      )) as engine.Path;
      Promise.all(
        (
          (await (await connectAndGetRepo(engine.PATH_SCHEMA))
            .search()
            .where("name")
            .equals(originalPath.name)
            .and("segment")
            .greaterThan(originalPath.segment)
            .returnAll()) as engine.Path[]
        ).map(async (path) => {
          path.segment++;
          await saveData(engine.PATH_SCHEMA, path);
        }),
      );
      const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
      const endSpace = originalPath.target;
      const intermediateSpaceLocation = JSON.stringify(
        { x: 0, y: 0 },
        jsonReplacer,
      );
      const intermediateSpace = new engine.OpenSpace(
        "virtual",
        true,
        intermediateSpaceLocation,
      );
      const intermediateSpaceId = await saveData(
        engine.SPACE_SCHEMA,
        intermediateSpace,
      );
      const newPath = new engine.Path(
        originalPath.locality,
        originalPath.segment++,
      );
      newPath._type = originalPath._type;
      newPath.name = originalPath.name;
      const newPathId = await saveData(engine.PATH_SCHEMA, newPath);
      await addPathSpaceFunctionality(
        spg,
        struct,
        intermediateSpaceId,
        newPathId,
        endSpace,
      );
      originalPath.target = intermediateSpaceId;
      originalPath.reachable.push(intermediateSpaceId);
      await saveData(engine.PATH_SCHEMA, originalPath);
      return newPathId;
    });
    SpacePathGraphType.libMethods.set("getStructJSON", async (...args) => {
      const spg: engine.SpacePathGraph = (await fetchData(
        engine.SPG_SCHEMA,
        args[0] as string,
      )) as engine.SpacePathGraph;
      return spg.structJSON;
    });
    SpacePathGraphType.libMethods.set("sendEntity", async (...args) => {
      const spg: engine.SpacePathGraph = (await fetchData(
        engine.SPG_SCHEMA,
        args[0] as string,
      )) as engine.SpacePathGraph;
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
          (
            await Promise.all(
              struct.table
                .get(curSpaceId)
                .map(
                  async (pathId) =>
                    (await fetchData(
                      engine.PATH_SCHEMA,
                      pathId,
                    )) as engine.Path,
                ),
            )
          ).filter((path) =>
            path.reachable.includes(targetSpaceId),
          )[0] as Entity
        )[EntityId];
        const sendError = await SpaceType.libMethods.get("sendEntity")(
          curSpaceId,
          args[1],
          pathId,
          args[4],
        );
        if (sendError !== undefined) return sendError;
        const receiveError = await SpaceType.libMethods.get("receiveEntity")(
          targetSpaceId,
          args[1],
          args[4],
        );
        if (receiveError !== undefined) return receiveError;
      }
    });
    SpacePathGraphType.libMethods.set("createMergeSpace", async (...args) => {
      const spg: engine.SpacePathGraph = (await fetchData(
        engine.SPG_SCHEMA,
        args[0] as string,
      )) as engine.SpacePathGraph;
      const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
      const mergeSpaceId = await saveData(
        engine.SPACE_SCHEMA,
        new engine.MergeSpace(
          false,
          args[2] as string,
          args[4] as string,
          "virtual",
          JSON.stringify({ x: 0, y: 0 }, jsonReplacer),
        ),
      );
      await addPathSpaceFunctionality(
        spg,
        struct,
        args[1] as string,
        args[2] as string,
        mergeSpaceId,
      );
      await addPathSpaceFunctionality(
        spg,
        struct,
        args[3] as string,
        args[4] as string,
        mergeSpaceId,
      );
      return mergeSpaceId;
    });
    SpacePathGraphType.libMethods.set(
      "createSelectionSpace",
      async (...args) => {
        const selectionSpaceId = await saveData(
          engine.SPACE_SCHEMA,
          new engine.SelectionSpace(
            false,
            args[3] as string,
            args[5] as string,
            "virtual",
            JSON.stringify({ x: 0, y: 0 }, jsonReplacer),
          ),
        );
        await SpacePathGraphType.libMethods.get("addPathSpace")(
          args[0],
          args[1],
          selectionSpaceId,
        );
        const spg: engine.SpacePathGraph = (await fetchData(
          engine.SPG_SCHEMA,
          args[0] as string,
        )) as engine.SpacePathGraph;
        const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
        await addPathSpaceFunctionality(
          spg,
          struct,
          selectionSpaceId,
          args[3] as string,
          args[2] as string,
        );
        await addPathSpaceFunctionality(
          spg,
          struct,
          selectionSpaceId,
          args[5] as string,
          args[4] as string,
        );
        return selectionSpaceId;
      },
    );
    SpacePathGraphType.libMethods.set("finalize", async (...args) => {
      const spg: engine.SpacePathGraph = (await fetchData(
        engine.SPG_SCHEMA,
        args[0] as string,
      )) as engine.SpacePathGraph;
      const struct: SPGStruct = JSON.parse(spg.structJSON, jsonReviver);
      const allPathIds = [].concat(...Array.from(struct.table.values()));
      await Promise.all(
        (
          await Promise.all(
            allPathIds.map(
              async (pathId) =>
                (await fetchData(engine.PATH_SCHEMA, pathId)) as engine.Path,
            ),
          )
        ).map(async (path) => {
          path.reachable = await updateReachable(struct, path.target);
          await saveData(engine.PATH_SCHEMA, path);
        }),
      );
    });
  }

  static mapMethodNameToMethodType(methodName: string): FunctionType {
    const maybeStringType = new UnionType(new Identifier("MaybeString"));
    maybeStringType.identifier.declaration = libDeclarations[1];
    const pathOrStringType = new UnionType(new Identifier("PathOrString"));
    pathOrStringType.identifier.declaration = libDeclarations[4];
    const mergeSpaceOrStringType = new UnionType(
      new Identifier("MergeSpaceOrString"),
    );
    mergeSpaceOrStringType.identifier.declaration = libDeclarations[5];
    const selectionSpaceOrStringType = new UnionType(
      new Identifier("SelectionSpaceOrString"),
    );
    selectionSpaceOrStringType.identifier.declaration = libDeclarations[6];
    switch (methodName) {
      case "setRoot":
        return new FunctionType(maybeStringType, [new SpaceType()]);
      case "addPathSpace":
        return new FunctionType(maybeStringType, [
          new PathType(),
          new SpaceType(),
        ]);
      case "splitPath":
        return new FunctionType(pathOrStringType, [new PathType()]);
      case "getStructJSON":
        return new FunctionType(DefaultBaseTypeInstance.STRING, []);
      case "sendEntity":
        return new FunctionType(maybeStringType, [
          new EntityType(),
          new SpaceType(),
          new SpaceType(),
          DefaultBaseTypeInstance.NUMBER,
        ]);
      case "createMergeSpace":
        return new FunctionType(mergeSpaceOrStringType, [
          new SpaceType(),
          new PathType(),
          new SpaceType(),
          new PathType(),
        ]);
      case "createSelectionSpace":
        return new FunctionType(selectionSpaceOrStringType, [
          new PathType(),
          new SpaceType(),
          new PathType(),
          new SpaceType(),
          new PathType(),
        ]);
      case "finalize":
        return new FunctionType(DefaultBaseTypeInstance.VOID, []);
    }
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const spacePathGraphTypeNodeId = newNodeId();
    dotString.push(
      spacePathGraphTypeNodeId + '[label=" Space Path Graph Type "];\n',
    );
    return spacePathGraphTypeNodeId;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SpacePathGraphType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export abstract class ControlSpaceType extends SpaceType {
  static libMethods: Map<string, (...args: unknown[]) => Promise<unknown>>;

  static {
    ControlSpaceType.libMethods = new Map<
      string,
      (...args: unknown[]) => Promise<unknown>
    >();
    ControlSpaceType.libMethods.set("setControl", async (...args) => {
      const space: engine.Space = (await fetchData(
        engine.SPACE_SCHEMA,
        args[0] as string,
      )) as engine.Space;
      if (!engine.isControlSpace(space))
        return "Can only set control signal on control space!";
      space.controlSignal = args[1] as boolean;
      await saveData(engine.SPACE_SCHEMA, space);
    });
  }

  static mapMethodNameToMethodType(methodName: string): FunctionType {
    const maybeStringType = new UnionType(new Identifier("MaybeString"));
    maybeStringType.identifier.declaration = libDeclarations[1];
    switch (methodName) {
      case "setControl":
        return new FunctionType(maybeStringType, [
          DefaultBaseTypeInstance.BOOL,
        ]);
    }
  }
}

export class SelectionSpaceType extends ControlSpaceType {
  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SelectionSpaceType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}

export class MergeSpaceType extends ControlSpaceType {
  equals(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof MergeSpaceType;
  }

  contains(_type: Type): boolean {
    return (
      this.equals(_type) ||
      (isDecorator(_type) && this.contains(_type.delegate))
    );
  }
}
