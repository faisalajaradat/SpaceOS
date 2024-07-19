import {
  fetchData,
  isControlSpace,
  saveData,
  Space,
  SPACE_SCHEMA,
} from "../../../../SpatialComputingEngine/src/index.js";
import { isAnyType, isDecorator } from "../../utils.js";
import { Identifier } from "../expr/Expr.js";
import { createSPG, getReachableSpaces, setFactory } from "../path-methods.js";
import { ASTNode, dotString, newNodeId } from "../program.js";
import {
  addEntities,
  getEntities,
  receiveEntity,
  sendEntity,
} from "../space-methods.js";
import {
  addPathSpace,
  createMergeSpace,
  createSelectionSpace,
  finalize,
  getStructJSON,
  sendEntityThrough,
  setRoot,
  splitPath,
} from "../spg-methods.js";
import { libDeclarations } from "../stmts.js";
import { SpacePathGraphFactoryType } from "./factory-types.js";
import {
  ArrayType,
  CompositionType,
  DefaultBaseTypeInstance,
  FunctionType,
  Type,
} from "./primitive-types.js";
import { UnionType } from "./UnionType.js";

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
    PathType.libMethods.set("getReachableSpaces", getReachableSpaces);
    PathType.libMethods.set("setFactory", setFactory);
    PathType.libMethods.set("createSPG", createSPG);
  }

  static mapMethodNameToMethodType(methodName): FunctionType {
    const maybeStringType = new UnionType(new Identifier("MaybeString"));
    maybeStringType.identifier.declaration = libDeclarations[1];
    const spacePathGraphOrStringType = new UnionType(
      new Identifier("SpacePathGraphOrString"),
    );
    spacePathGraphOrStringType.identifier.declaration = libDeclarations[7];
    switch (methodName) {
      case "getReachableSpaces":
        return new FunctionType(new ArrayType(new SpaceType()), []);
      case "setFactory":
        return new FunctionType(maybeStringType, [
          new SpacePathGraphFactoryType(),
        ]);
      case "createSPG":
        return new FunctionType(spacePathGraphOrStringType, []);
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
    SpaceType.libMethods.set("addEntities", addEntities);
    SpaceType.libMethods.set("getEntities", getEntities);
    SpaceType.libMethods.set("sendEntity", sendEntity);
    SpaceType.libMethods.set("receiveEntity", receiveEntity);
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

export class SpacePathGraphType extends SpatialType {
  static libMethods: Map<string, (...args: unknown[]) => Promise<unknown>>;

  constructor(line: number = -1, column: number = -1) {
    super(line, column);
  }

  static {
    SpacePathGraphType.libMethods = new Map<
      string,
      (...args: unknown[]) => Promise<unknown>
    >();
    SpacePathGraphType.libMethods.set("setRoot", setRoot);
    SpacePathGraphType.libMethods.set("addPathSpace", addPathSpace);
    SpacePathGraphType.libMethods.set("splitPath", splitPath);
    SpacePathGraphType.libMethods.set("getStructJSON", getStructJSON);
    SpacePathGraphType.libMethods.set("sendEntityThrough", sendEntityThrough);
    SpacePathGraphType.libMethods.set("createMergeSpace", createMergeSpace);
    SpacePathGraphType.libMethods.set(
      "createSelectionSpace",
      createSelectionSpace,
    );
    SpacePathGraphType.libMethods.set("finalize", finalize);
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
      case "sendEntityThrough":
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
      const space: Space = (await fetchData(
        SPACE_SCHEMA,
        args[0] as string,
      )) as Space;
      if (!isControlSpace(space))
        return "Can only set control signal on control space!";
      space.controlSignal = args[1] as boolean;
      await saveData(SPACE_SCHEMA, space);
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
