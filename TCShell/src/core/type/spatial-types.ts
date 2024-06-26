import { ASTNode, dotString, newNodeId } from "../program.js";
import { CompositionType, Type } from "./primitive-types.js";
import { isAnyType, isDecorator } from "../../utils.js";

export class SpatialType extends CompositionType {
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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

  constructor(line: number, column: number, delegate: SpatialType) {
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

  async evaluate(): Promise<void> {
    return undefined;
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

  async evaluate(): Promise<void> {
    return undefined;
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

export class SpacePathGraphType extends SpatialType {
  constructor(line: number, column: number) {
    super(line, column);
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

  async evaluate(): Promise<void> {
    return undefined;
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

export class PathType extends SpatialType {
  constructor(line: number, column: number) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const pathNodeId = newNodeId();
    dotString.push(pathNodeId + '[label=" Path "];\n');
    return pathNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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

  constructor(line: number, column: number, delegate: SpatialObjectType) {
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

  async evaluate(): Promise<void> {
    return undefined;
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

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
    super(line, column);
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const spaceNodeId = newNodeId();
    dotString.push(spaceNodeId + '[label=" Space "];\n');
    return spaceNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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
  constructor(line: number, column: number) {
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

  async evaluate(): Promise<void> {
    return undefined;
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

  constructor(line: number, column: number, delegate: DynamicEntityType) {
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

  async evaluate(): Promise<void> {
    return undefined;
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

  async evaluate(): Promise<void> {
    return undefined;
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
