import {isAnyType, isDecorator} from "../utils.js";
import {ASTNode, dotString, newNodeId} from "./core.js";
import {Identifier, UnionDeclaration} from "./stmt.js";

export abstract class Type implements ASTNode {
    line: number;
    column: number;

    abstract children(): ASTNode[];

    abstract print(): string;

    abstract evaluate(): Promise<unknown>;

    abstract equals(_type: Type): boolean;

    constructor(line: number, column: number) {
        this.line = line;
        this.column = column;
    }

    getFilePos(): string {
        return "line: " + this.line + ", column: " + this.column + ", ";
    }
}

export abstract class CompositionType extends Type {
    abstract contains(_type: Type): boolean;
}

export enum BaseTypeKind {
    NUMBER,
    STRING,
    BOOL,
    VOID,
    ANY,
    NONE,
}

export const astBaseTypeMap = new Map<BaseTypeKind, string>();


astBaseTypeMap.set(BaseTypeKind.NUMBER, "number");
astBaseTypeMap.set(BaseTypeKind.STRING, "string");
astBaseTypeMap.set(BaseTypeKind.BOOL, "boolean");
astBaseTypeMap.set(BaseTypeKind.VOID, "undefined");

export class BaseType extends Type {
    kind: BaseTypeKind;

    constructor(line: number, column: number, kind: BaseTypeKind) {
        super(line, column);
        this.kind = kind;
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    equals(_type: Type): boolean {
        return (
            this.kind === BaseTypeKind.ANY ||
            (_type instanceof BaseType &&
                (this.kind === _type.kind || _type.kind === BaseTypeKind.ANY))
        );
    }

    print(): string {
        const typeNodeId = newNodeId();
        let label = "";
        switch (this.kind) {
            case BaseTypeKind.NUMBER:
                label = "number";
                break;
            case BaseTypeKind.STRING:
                label = "string";
                break;
            case BaseTypeKind.BOOL:
                label = "bool";
                break;
            case BaseTypeKind.VOID:
                label = "void";
                break;
            case BaseTypeKind.NONE:
                break;
        }
        dotString.push(typeNodeId + '[label=" ' + label + ' "];\n');
        return typeNodeId;
    }

    async evaluate(): Promise<string> {
        return astBaseTypeMap.get(this.kind);
    }
}

export abstract class FactoryType extends Type {
    protected constructor(line: number, column: number) {
        super(line, column);
    }
}

export class SpaceFactoryType extends FactoryType {
    constructor(line: number, column: number) {
        super(line, column);
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    print(): string {
        const spaceFactoryTypeNodeId = newNodeId();
        dotString.push(
            spaceFactoryTypeNodeId + '[label=" Space Factory Type "];\n',
        );
        return spaceFactoryTypeNodeId;
    }

    async evaluate(): Promise<void> {
        return undefined;
    }

    equals(_type: Type): boolean {
        return isAnyType(_type) || _type instanceof SpaceFactoryType;
    }
}

export class EntityFactoryType extends FactoryType {
    constructor(line: number, column: number) {
        super(line, column);
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    print(): string {
        const entityFactoryTypeNodeId = newNodeId();
        dotString.push(
            entityFactoryTypeNodeId + '[label=" Entity Factory Type "];\n',
        );
        return entityFactoryTypeNodeId;
    }

    async evaluate(): Promise<void> {
        return undefined;
    }

    equals(_type: Type): boolean {
        return isAnyType(_type) || _type instanceof EntityFactoryType;
    }
}

export class PathFactoryType extends FactoryType {
    constructor(line: number, column: number) {
        super(line, column);
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    print(): string {
        const pathFactoryTypeNodeId = newNodeId();
        dotString.push(
            pathFactoryTypeNodeId + '[label=" Path Factory Type "];\n',
        );
        return pathFactoryTypeNodeId;
    }

    async evaluate(): Promise<void> {
        return undefined;
    }

    equals(_type: Type): boolean {
        return isAnyType(_type) || _type instanceof PathFactoryType;
    }
}

export class SpatialType extends CompositionType {
    constructor(line: number, column: number) {
        super(line, column);
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    print(): string {
        const spatialTypeNodeId = newNodeId();
        dotString.push(
            spatialTypeNodeId + '[label=" Spatial Type "];\n',
        );
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
    implements SpatialTypeDecorator {
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
        dotString.push(
            physicalNodeId + "->" + delegateNodeId + ";\n",
        );
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

export abstract class SpatialObjectType extends SpatialType {
}

export abstract class ControlDecorator
    extends SpatialObjectType
    implements SpatialTypeDecorator {
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
        dotString.push(
            controlledNodeId + '[label=" Controlled "];\n',
        );
        const delegateNodeId = this.delegate.print();
        dotString.push(
            controlledNodeId + "->" + delegateNodeId + ";\n",
        );
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
        dotString.push(
            notControlledNodeId + '[label=" Not Controlled "];\n',
        );
        const delegateNodeId = this.delegate.print();
        dotString.push(
            notControlledNodeId + "->" + delegateNodeId + ";\n",
        );
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
        dotString.push(
            enclosedSpaceNodeId + '[label=" Enclosed Space "];\n',
        );
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
        dotString.push(
            staticEntityNodeId + '[label=" Static Entity "];\n',
        );
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
        dotString.push(
            dynamicEntityNodeId + '[label=" Dynamic Entity "];\n',
        );
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
        dotString.push(
            animateEntityNodeId + '[label=" Animate Entity "];\n',
        );
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
        dotString.push(
            smartEntityNodeId + '[label=" Smart Entity "];\n',
        );
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
    implements SpatialTypeDecorator {
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
        dotString.push(
            stationaryNodeId + '[label=" Stationary "];\n',
        );
        const delegateNodeId = this.delegate.print();
        dotString.push(
            stationaryNodeId + "->" + delegateNodeId + ";\n",
        );
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

export class UnionType extends CompositionType {
    identifier: Identifier;

    constructor(line: number, column: number, identifier: Identifier) {
        super(line, column);
        this.identifier = identifier;
    }

    children(): ASTNode[] {
        return [this.identifier];
    }

    equals(_type: Type): boolean {
        if (isAnyType(_type)) return true;
        if (
            _type instanceof UnionType &&
            (<UnionDeclaration>this.identifier.declaration).options.length ===
            (<UnionDeclaration>_type.identifier.declaration).options.length
        ) {
            let numOfMatchingOptions = 0;
            (<UnionDeclaration>this.identifier.declaration).options.forEach(
                (option0) => {
                    numOfMatchingOptions += (<UnionDeclaration>(
                        _type.identifier.declaration
                    )).options.filter((option1) => option0.equals(option1)).length;
                },
            );
            return (
                numOfMatchingOptions ===
                (<UnionDeclaration>this.identifier.declaration).options.length
            );
        }
        return false;
    }

    print(): string {
        const unionType = newNodeId();
        dotString.push(unionType + '[label=" UnionType "];\n');
        const identifierNodeId = this.identifier.print();
        dotString.push(unionType + "->" + identifierNodeId + ";\n");
        return unionType;
    }

    async evaluate(): Promise<void> {
        return undefined;
    }

    contains(_type: Type): boolean {
        let containsType = false;
        (<UnionDeclaration>this.identifier.declaration).options.forEach(
            (option) => {
                if (containsType) return;
                containsType = option.equals(_type);
            },
        );
        return containsType;
    }
}

export class FunctionType extends Type {
    returnType: Type;
    paramTypes: Type[];

    constructor(
        line: number,
        column: number,
        returnType: Type,
        paramTypes: Type[],
    ) {
        super(line, column);
        this.returnType = returnType;
        this.paramTypes = paramTypes;
    }

    children(): ASTNode[] {
        const children = new Array<ASTNode>();
        children.push(this.returnType);
        children.push(...this.paramTypes);
        return children;
    }

    equals(_type: Type): boolean {
        return (
            isAnyType(_type) ||
            (_type instanceof FunctionType &&
                this.returnType.equals(_type.returnType) &&
                this.paramTypes.filter(
                    (paramType, pos) => !paramType.equals(_type.paramTypes[pos]),
                ).length === 0)
        );
    }

    print(): string {
        const functionTypeNodeId = newNodeId();
        dotString.push(
            functionTypeNodeId + '[label=" Function "];\n',
        );
        const typeNodeId = this.returnType.print();
        dotString.push(
            functionTypeNodeId + "->" + typeNodeId + ";\n",
        );
        this.paramTypes
            .map((paramType) => paramType.print())
            .forEach(
                (nodeId) =>
                    (dotString.push(
                        functionTypeNodeId + "->" + nodeId + ";\n",
                    )),
            );
        return functionTypeNodeId;
    }

    async evaluate(): Promise<void> {
        return undefined;
    }
}

export class ArrayType extends Type {
    _type: Type;
    _size: number;

    constructor(line: number, column: number, type: Type, size: number) {
        super(line, column);
        this._type = type;
        this._size = size;
    }

    children(): ASTNode[] {
        return [this._type];
    }

    equals(_type: Type): boolean {
        return (
            isAnyType(_type) ||
            (_type instanceof ArrayType && this._type.equals(_type._type))
        );
    }

    print(): string {
        const arrayTypeNodeId = newNodeId();
        dotString.push(arrayTypeNodeId + '[label=" Array Of "];\n');
        const typeNodeId = this._type;
        dotString.push(arrayTypeNodeId + "->" + typeNodeId + ";\n");
        return arrayTypeNodeId;
    }

    async evaluate(): Promise<void> {
        return undefined;
    }
}