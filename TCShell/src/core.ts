import { Scope } from "./semantics.js";
import { popOutOfScopeVars, getValueOfExpression } from "./utils.js";

//A map variable declaration and their stack of assigned values
const varStacks = new Map<VarDeclaration | Parameter, unknown[]>();

export class ArrayRepresentation {
  array: unknown[];
  index: number;

  constructor(array: unknown[], index: number) {
    this.array = array;
    this.index = index;
  }
}

let dotString = "";
let nodeCount = 0;

function writeFunDeclarationDot(
  node: FunDeclaration,
  funDeclNodeId: string,
): void {
  const typeNodeId = node.stmtType.print();
  const paramNodeIds = new Array<string>();
  node.params.forEach((child) => paramNodeIds.push(child.print()));
  const blockNodeId = node._body.print();
  dotString = dotString.concat(funDeclNodeId + "->" + typeNodeId + ";\n");
  paramNodeIds.forEach(
    (nodeId) =>
      (dotString = dotString.concat(funDeclNodeId + "->" + nodeId + ";\n")),
  );
  dotString = dotString.concat(funDeclNodeId + "->" + blockNodeId + ";\n");
}

//Define all AST nodes
export interface ASTNode {
  children(): ASTNode[];
  //Implement dot printer behaviour for node
  print(): string;
  //Implement tree walker behaviour for node
  evaluate(): unknown;
}

export enum BaseTypeKind {
  NUMBER,
  STRING,
  BOOL,
  VOID,
  ANY,
  NONE,
}

const astBaseTypeMap = new Map<BaseTypeKind, string>();
astBaseTypeMap.set(BaseTypeKind.NUMBER, "number");
astBaseTypeMap.set(BaseTypeKind.STRING, "string");
astBaseTypeMap.set(BaseTypeKind.BOOL, "boolean");
astBaseTypeMap.set(BaseTypeKind.VOID, "undefined");

function isAnyType(_type: Type) {
  return _type instanceof BaseType && _type.kind === BaseTypeKind.ANY;
}

function isWildcard(matchCondition: Parameter | Expr) {
  return (
    matchCondition instanceof Parameter && isAnyType(matchCondition.stmtType)
  );
}

export abstract class Type implements ASTNode {
  abstract children(): ASTNode[];
  abstract print(): string;
  abstract evaluate(): unknown;
  abstract equals(_type: Type): boolean;
}
export abstract class CompositionType extends Type {
  abstract contains(_type: Type): boolean;
}
export class BaseType extends Type {
  kind: BaseTypeKind;

  constructor(kind: BaseTypeKind) {
    super();
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
    const typeNodeId = "Node" + nodeCount++;
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
    dotString = dotString.concat(typeNodeId + '[label=" ' + label + ' "];\n');
    return typeNodeId;
  }

  evaluate(): unknown {
    return astBaseTypeMap.get(this.kind);
  }
}
export class SpatialType extends CompositionType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const spatialTypeNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      spatialTypeNodeId + '[label=" Spatial Type "];\n',
    );
    return spatialTypeNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        !(
          _type instanceof LocalityDecorator ||
          _type instanceof SpatialObjectType ||
          _type instanceof PathType
        ))
    );
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SpatialType;
  }
}
export abstract class LocalityDecorator extends SpatialType {
  delegate: SpatialType;

  constructor(delegate: SpatialType) {
    super();
    this.delegate = delegate;
  }
}
export class PhysicalDecorator extends LocalityDecorator {
  constructor(delegate: SpatialType) {
    super(delegate);
  }

  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const physicalNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(physicalNodeId + '[label=" Physical "];\n');
    const delegateNodeId = this.delegate.print();
    dotString = dotString.concat(
      physicalNodeId + "->" + delegateNodeId + ";\n",
    );
    return physicalNodeId;
  }

  evaluate(): unknown {
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
  constructor(delegate: SpatialType) {
    super(delegate);
  }

  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const virtualNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(virtualNodeId + '[label=" Virtual "];\n');
    const delegateNodeId = this.delegate.print();
    dotString = dotString.concat(virtualNodeId + "->" + delegateNodeId + ";\n");
    return virtualNodeId;
  }

  evaluate(): unknown {
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
export class PathType extends SpatialType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const pathNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(pathNodeId + '[label=" Path "];\n');
    return pathNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        !(_type instanceof LandPathType || _type instanceof AirPathType))
    );
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof PathType;
  }
}
export class LandPathType extends PathType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const landPathNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(landPathNodeId + '[label=" Land Path "];\n');
    return landPathNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return this.contains(_type);
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof LandPathType;
  }
}
export class AirPathType extends PathType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const airPathNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(airPathNodeId + '[label=" Air Path "];\n');
    return airPathNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return this.contains(_type);
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof AirPathType;
  }
}
export abstract class SpatialObjectType extends SpatialType {}
export abstract class ControlDecorator extends SpatialObjectType {
  delegate: SpatialObjectType;
  constructor(delegate: SpatialObjectType) {
    super();
    this.delegate = delegate;
  }
}
export class ControlledDecorator extends ControlDecorator {
  constructor(delegate: SpatialObjectType) {
    super(delegate);
  }
  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const controlledNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      controlledNodeId + '[label=" Controlled "];\n',
    );
    const delegateNodeId = this.delegate.print();
    dotString = dotString.concat(
      controlledNodeId + "->" + delegateNodeId + ";\n",
    );
    return controlledNodeId;
  }

  evaluate(): unknown {
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
  constructor(delegate: SpatialObjectType) {
    super(delegate);
  }

  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const notControlledNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      notControlledNodeId + '[label=" Not Controlled "];\n',
    );
    const delegateNodeId = this.delegate.print();
    dotString = dotString.concat(
      notControlledNodeId + "->" + delegateNodeId + ";\n",
    );
    return notControlledNodeId;
  }

  evaluate(): unknown {
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
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const spaceNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(spaceNodeId + '[label=" Space "];\n');
    return spaceNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        !(_type instanceof OpenSpaceType || _type instanceof EnclosedSpaceType))
    );
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof SpaceType;
  }
}
export class OpenSpaceType extends SpaceType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const openSpaceNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(openSpaceNodeId + '[label=" Open Space "];\n');
    return openSpaceNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return this.contains(_type);
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof OpenSpaceType;
  }
}
export class EnclosedSpaceType extends SpaceType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const enclosedSpaceNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      enclosedSpaceNodeId + '[label=" Enclosed Space "];\n',
    );
    return enclosedSpaceNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return this.contains(_type);
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof EnclosedSpaceType;
  }
}
export class EntityType extends SpatialObjectType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const entityNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(entityNodeId + '[label=" Entity "];\n');
    return entityNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        !(
          _type instanceof DynamicEntityType ||
          _type instanceof StaticEntityType
        ))
    );
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof EntityType;
  }
}
export class StaticEntityType extends EntityType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const staticEntityNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      staticEntityNodeId + '[label=" Static Entity "];\n',
    );
    return staticEntityNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return this.contains(_type);
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof StaticEntityType;
  }
}
export class DynamicEntityType extends EntityType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const dynamicEntityNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      dynamicEntityNodeId + '[label=" Dynamic Entity "];\n',
    );
    return dynamicEntityNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return (
      isAnyType(_type) ||
      (this.contains(_type) &&
        !(
          _type instanceof MotionDecorator ||
          _type instanceof AnimateEntityType ||
          _type instanceof SmartEntityType
        ))
    );
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof DynamicEntityType;
  }
}
export class AnimateEntityType extends DynamicEntityType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const animateEntityNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      animateEntityNodeId + '[label=" Animate Entity "];\n',
    );
    return animateEntityNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return this.contains(_type);
  }

  contains(_type: Type): boolean {
    return isAnyType(_type) || _type instanceof AnimateEntityType;
  }
}
export class SmartEntityType extends DynamicEntityType {
  constructor() {
    super();
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const smartEntityNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      smartEntityNodeId + '[label=" Smart Entity "];\n',
    );
    return smartEntityNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }

  equals(_type: Type): boolean {
    return isAnyType(_type) || this.contains(_type);
  }

  contains(_type: Type): boolean {
    return _type instanceof SmartEntityType;
  }
}
export abstract class MotionDecorator extends DynamicEntityType {
  delegate: DynamicEntityType;

  constructor(delegate: DynamicEntityType) {
    super();
    this.delegate = delegate;
  }
}
export class MobileDecorator extends MotionDecorator {
  constructor(delegate: DynamicEntityType) {
    super(delegate);
  }

  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const mobileNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(mobileNodeId + '[label=" Mobile "];\n');
    const delegateNodeId = this.delegate.print();
    dotString = dotString.concat(mobileNodeId + "->" + delegateNodeId + ";\n");
    return mobileNodeId;
  }

  evaluate(): unknown {
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
  constructor(delegate: DynamicEntityType) {
    super(delegate);
  }

  children(): ASTNode[] {
    return this.delegate.children();
  }

  print(): string {
    const stationaryNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      stationaryNodeId + '[label=" Stationary "];\n',
    );
    const delegateNodeId = this.delegate.print();
    dotString = dotString.concat(
      stationaryNodeId + "->" + delegateNodeId + ";\n",
    );
    return stationaryNodeId;
  }

  evaluate(): unknown {
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

  constructor(identifier: Identifier) {
    super();
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
    const unionType = "Node" + nodeCount++;
    dotString = dotString.concat(unionType + '[label=" UnionType "];\n');
    const identifierNodeId = this.identifier.print();
    dotString = dotString.concat(unionType + "->" + identifierNodeId + ";\n");
    return unionType;
  }

  evaluate(): unknown {
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

  constructor(returnType: Type, paramTypes: Type[]) {
    super();
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
    const functionTypeNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      functionTypeNodeId + '[label=" Function "];\n',
    );
    const typeNodeId = this.returnType.print();
    dotString = dotString.concat(
      functionTypeNodeId + "->" + typeNodeId + ";\n",
    );
    this.paramTypes
      .map((paramType) => paramType.print())
      .forEach(
        (nodeId) =>
          (dotString = dotString.concat(
            functionTypeNodeId + "->" + nodeId + ";\n",
          )),
      );
    return functionTypeNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }
}
export class ArrayType extends Type {
  _type: Type;
  _size: number;

  constructor(type: Type, size: number) {
    super();
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
    const arrayTypeNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(arrayTypeNodeId + '[label=" Array Of "];\n');
    const typeNodeId = this._type;
    dotString = dotString.concat(arrayTypeNodeId + "->" + typeNodeId + ";\n");
    return arrayTypeNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }
}
export class Program implements ASTNode {
  stmts: ASTNode[];
  scope: Scope;

  constructor(stmts: ASTNode[]) {
    this.stmts = stmts;
  }

  children(): ASTNode[] {
    const children: ASTNode[] = new Array<ASTNode>();
    children.push(...this.stmts);
    return children;
  }

  print(): string {
    dotString = dotString.concat("digraph ast {\n");
    const programNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(programNodeId + '[label=" Program "];\n');
    const declsNodeIds = new Array<string>();
    this.children().forEach((child) => declsNodeIds.push(child.print()));
    declsNodeIds.forEach(
      (nodeId) =>
        (dotString = dotString.concat(programNodeId + "->" + nodeId + ";\n")),
    );
    return dotString.concat("}");
  }

  evaluate(): unknown {
    this.children().forEach((stmt) => stmt.evaluate());
    popOutOfScopeVars(this, varStacks);
    return undefined;
  }
}
export abstract class Stmt implements ASTNode {
  abstract children(): ASTNode[];
  abstract print(): string;
  abstract evaluate(): unknown;
  stmtType: Type;

  constructor(type: Type) {
    this.stmtType = type;
  }
}
export abstract class Expr extends Stmt {
  constructor(type: Type) {
    super(type);
  }
}
export class Parameter extends Stmt {
  identifier: Identifier;

  constructor(paramType: Type, identifier: Identifier) {
    super(paramType);
    this.identifier = identifier;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.stmtType);
    children.push(this.identifier);
    return children;
  }

  print(): string {
    const paramNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(paramNodeId + '[label=" Param "];\n');
    const typeNodeId = this.stmtType.print();
    const identifierNodeId = this.identifier.print();
    dotString = dotString.concat(paramNodeId + "->" + typeNodeId + ";\n");
    dotString = dotString.concat(paramNodeId + "->" + identifierNodeId + ";\n");
    return paramNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }
}

export class VarDeclaration extends Stmt {
  identifier: Identifier;
  value: Expr;

  constructor(type: Type, identifier: Identifier, value: Expr) {
    super(type);
    this.identifier = identifier;
    this.value = value;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.identifier);
    children.push(this.value);
    return children;
  }

  print(): string {
    const varDeclNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(varDeclNodeId + '[label=" = "];\n');
    const typeNodeId = this.stmtType.print();
    const identifierNodeId = this.identifier.print();
    const valueNodeId = this.value.print();
    dotString = dotString.concat(varDeclNodeId + "->" + typeNodeId + ";\n");
    dotString = dotString.concat(
      varDeclNodeId + "->" + identifierNodeId + ";\n",
    );
    dotString = dotString.concat(varDeclNodeId + "->" + valueNodeId + ";\n");
    return varDeclNodeId;
  }

  evaluate(): unknown {
    const value =
      this.value instanceof FunDeclaration
        ? this.value
        : getValueOfExpression(this.value.evaluate(), varStacks);
    const varStack = varStacks.get(this);
    if (varStack === undefined) varStacks.set(this, [value]);
    else varStack.push(value);
    return undefined;
  }
}
export class UnionDeclaration extends Stmt {
  options: Type[];

  constructor(unionType: Type, options: Type[]) {
    super(unionType);
    this.options = options;
  }

  children(): ASTNode[] {
    return [...this.options];
  }

  print(): string {
    const unionDeclNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(unionDeclNodeId + '[label= "Union"];\n');
    const unionTypeNodeId = this.stmtType.print();
    dotString = dotString.concat(
      unionDeclNodeId + "->" + unionTypeNodeId + ";\n",
    );
    this.options
      .map((option) => option.print())
      .forEach(
        (nodeId) =>
          (dotString = dotString.concat(
            unionDeclNodeId + "->" + nodeId + ";\n",
          )),
      );
    return unionDeclNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }
}
export class Return extends Stmt {
  possibleValue: Expr;

  constructor(possibleValue: Expr) {
    super(new BaseType(BaseTypeKind.NONE));
    this.possibleValue = possibleValue;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    if (this.possibleValue !== undefined) children.push(this.possibleValue);
    return children;
  }

  print(): string {
    const returnNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(returnNodeId + '[label=" return "];\n');
    if (this.possibleValue === null) return returnNodeId;
    const valueNodeId = this.possibleValue.print();
    dotString = dotString.concat(returnNodeId + "->" + valueNodeId + ";\n");
    return returnNodeId;
  }

  evaluate(): unknown {
    return this;
  }
}
export class If extends Stmt {
  condition: Expr;
  ifStmt: Stmt;
  possibleElseStmt: Stmt;

  constructor(condition: Expr, ifStmt: Stmt, possibleElseStmt: Stmt) {
    super(new BaseType(BaseTypeKind.NONE));
    this.condition = condition;
    this.ifStmt = ifStmt;
    this.possibleElseStmt = possibleElseStmt;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.condition);
    children.push(this.ifStmt);
    if (this.possibleElseStmt !== null) children.push(this.possibleElseStmt);
    return children;
  }

  print(): string {
    const ifNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(ifNodeId + '[label=" if "];\n');
    let elseStmtNodeId = "";
    let elseNodeId = "";
    const conditionNodeId = this.condition.print();
    const stmtNodeId = this.ifStmt.print();
    if (this.possibleElseStmt !== null) {
      elseNodeId = "Node" + nodeCount++;
      dotString = dotString.concat(elseNodeId + '[label=" else "];\n');
      elseStmtNodeId = this.possibleElseStmt.print();
    }
    dotString = dotString.concat(ifNodeId + "->" + conditionNodeId + ";\n");
    dotString = dotString.concat(ifNodeId + "->" + stmtNodeId + ";\n");
    if (elseNodeId !== "") {
      dotString = dotString.concat(ifNodeId + "->" + elseNodeId + ";\n");
      dotString = dotString.concat(elseNodeId + "->" + elseStmtNodeId + ";\n");
    }
    return ifNodeId;
  }

  evaluate(): unknown {
    if (<boolean>getValueOfExpression(this.condition.evaluate(), varStacks))
      return this.ifStmt.evaluate();
    else if (this.possibleElseStmt !== null)
      return this.possibleElseStmt.evaluate();
  }
}
export class While extends Stmt {
  condition: Expr;
  whileStmt: Stmt;

  constructor(condition: Expr, whileStmt: Stmt) {
    super(new BaseType(BaseTypeKind.NONE));
    this.condition = condition;
    this.whileStmt = whileStmt;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.condition);
    children.push(this.whileStmt);
    return children;
  }

  print(): string {
    const whileNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(whileNodeId + '[label=" while "];\n');
    const conditionNodeId = this.condition.print();
    const stmtNodeId = this.whileStmt.print();
    dotString = dotString.concat(whileNodeId + "->" + conditionNodeId + ";\n");
    dotString = dotString.concat(whileNodeId + "->" + stmtNodeId + ";\n");
    return whileNodeId;
  }

  evaluate(): unknown {
    let returnValue = undefined;
    while (<boolean>getValueOfExpression(this.condition.evaluate(), varStacks))
      returnValue = this.whileStmt.evaluate();
    return returnValue;
  }
}
export class Block extends Stmt {
  stmts: Stmt[];
  scope: Scope;

  constructor(stmts: Stmt[]) {
    super(new BaseType(BaseTypeKind.NONE));
    this.stmts = stmts;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.stmts);
    return children;
  }

  print(): string {
    const blockNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(blockNodeId + '[label=" Block "];\n');
    const stmtIds = new Array<string>();
    this.stmts.forEach((stmt) => stmtIds.push(stmt.print()));
    stmtIds.forEach(
      (nodeId) =>
        (dotString = dotString.concat(blockNodeId + "->" + nodeId + ";\n")),
    );
    return blockNodeId;
  }

  evaluate(): unknown {
    let returnNode = undefined;
    for (let i = 0; i < this.stmts.length; i++) {
      returnNode = this.stmts[i].evaluate();
      if (returnNode instanceof Return) break;
    }
    if (returnNode instanceof Return && returnNode.possibleValue !== null)
      returnNode = getValueOfExpression(
        returnNode.possibleValue.evaluate(),
        varStacks,
      );
    popOutOfScopeVars(this, varStacks);
    return returnNode;
  }
}
export class CaseStmt extends Stmt {
  matchCondition: Parameter | Expr;
  stmt: Stmt;
  scope: Scope;

  constructor(matchCondition: Parameter | Expr, stmt: Stmt) {
    super(new BaseType(BaseTypeKind.NONE));
    this.matchCondition = matchCondition;
    this.stmt = stmt;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    if (
      !(
        this.matchCondition instanceof Parameter &&
        isAnyType(this.matchCondition.stmtType)
      )
    )
      children.push(this.matchCondition);
    children.push(this.stmt);
    return children;
  }

  print(): string {
    const caseStmtNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(caseStmtNodeId + '[label=" Case "];\n');
    const matchConditionNodeId = this.matchCondition.print();
    const stmtNodeId = this.stmt.print();
    dotString = dotString.concat(
      caseStmtNodeId + "->" + matchConditionNodeId + ";\n",
    );
    dotString = dotString.concat(caseStmtNodeId + "->" + stmtNodeId + ";\n");
    return caseStmtNodeId;
  }

  evaluate(): unknown {
    let returnValue = this.stmt.evaluate();
    if (returnValue instanceof Return && returnValue.possibleValue !== null)
      returnValue = getValueOfExpression(
        returnValue.possibleValue.evaluate(),
        varStacks,
      );
    popOutOfScopeVars(this, varStacks);
    return returnValue;
  }
}
export class Match extends Stmt {
  subject: Expr;
  caseStmts: CaseStmt[];

  constructor(subject: Expr, caseStmts: CaseStmt[]) {
    super(new BaseType(BaseTypeKind.NONE));
    this.subject = subject;
    this.caseStmts = caseStmts;
  }

  match(condition: Parameter | Expr, subject: unknown) {
    if (condition instanceof Parameter) {
      if (isAnyType(condition.stmtType)) return true;
      if (condition.stmtType instanceof BaseType)
        return typeof subject === condition.stmtType.evaluate();
      if (
        condition.stmtType instanceof ArrayType &&
        subject instanceof ArrayRepresentation
      ) {
        let subjectBase = subject.array;
        let conditionTypeBase = condition.stmtType;
        while (
          conditionTypeBase._type instanceof ArrayType &&
          Array.isArray(subjectBase[0])
        ) {
          conditionTypeBase = conditionTypeBase._type;
          subjectBase = subjectBase[0];
        }
        return typeof subjectBase[0] === conditionTypeBase._type.evaluate();
      }
      return false;
    }
    return subject === condition.evaluate();
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.subject);
    children.push(...this.caseStmts);
    return children;
  }

  print(): string {
    const matchNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(matchNodeId + '[label=" Match "];\n');
    const subjectNodeId = this.subject.print();
    dotString = dotString.concat(matchNodeId + "->" + subjectNodeId + ";\n");
    this.caseStmts
      .map((caseStmt) => caseStmt.print())
      .forEach(
        (nodeId) =>
          (dotString = dotString.concat(matchNodeId + "->" + nodeId + ";\n")),
      );
    return matchNodeId;
  }

  evaluate(): unknown {
    const subjectValue = getValueOfExpression(
      this.subject.evaluate(),
      varStacks,
    );
    const matchedCases = this.caseStmts
      .sort((a, b) => {
        if (
          (a.matchCondition instanceof Expr &&
            b.matchCondition instanceof Parameter) ||
          (isWildcard(b.matchCondition) && !isWildcard(a.matchCondition))
        )
          return -1;
        if (
          (a.matchCondition instanceof Parameter &&
            b.matchCondition instanceof Expr) ||
          isWildcard(a.matchCondition) ||
          !isWildcard(b.matchCondition)
        )
          return 1;
        return 0;
      })
      .filter((caseStmt) => this.match(caseStmt.matchCondition, subjectValue));
    const matchedCase = matchedCases[0];
    if (
      matchedCase.matchCondition instanceof Parameter &&
      !isWildcard(matchedCase.matchCondition)
    ) {
      const paramStack = varStacks.get(matchedCase.matchCondition);
      if (paramStack === undefined)
        varStacks.set(matchedCase.matchCondition, [subjectValue]);
      else paramStack.push(subjectValue);
    }
    return matchedCase.evaluate();
  }
}
export class BinaryExpr extends Expr {
  leftExpr: Expr;
  operator: string;
  rightExpr: Expr;

  constructor(type: Type, operator: string, leftExpr: Expr, rightExpr: Expr) {
    super(type);
    this.leftExpr = leftExpr;
    this.operator = operator;
    this.rightExpr = rightExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.leftExpr);
    children.push(this.rightExpr);
    return children;
  }

  print(): string {
    const opNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      opNodeId + '[label=" ' + this.operator + ' "];\n',
    );
    const leftExprId = this.leftExpr.print();
    const rightExprId = this.rightExpr.print();
    dotString = dotString.concat(opNodeId + "->" + leftExprId + ";\n");
    dotString = dotString.concat(opNodeId + "->" + rightExprId + ";\n");
    return opNodeId;
  }

  evaluate(): unknown {
    let leftHandExp = this.leftExpr.evaluate();
    const rightHandExp =
      this.rightExpr instanceof FunDeclaration
        ? this.rightExpr
        : getValueOfExpression(this.rightExpr.evaluate(), varStacks);
    if (this.operator === "=") {
      if (leftHandExp instanceof Identifier) {
        const varStack = varStacks.get(
          <VarDeclaration | Parameter>(<Identifier>leftHandExp).declaration,
        );
        varStack[varStack.length - 1] = rightHandExp;
      } else if (leftHandExp instanceof ArrayRepresentation)
        leftHandExp.array[leftHandExp.index] = rightHandExp;
      return rightHandExp;
    }
    leftHandExp = getValueOfExpression(leftHandExp, varStacks);
    switch (this.operator) {
      case "||":
        return <boolean>leftHandExp || <boolean>rightHandExp;
      case "&&":
        return <boolean>leftHandExp && <boolean>rightHandExp;
      case "==":
        return leftHandExp === rightHandExp;
      case "!=":
        return leftHandExp !== rightHandExp;
      case "<=":
        return <number>leftHandExp <= <number>rightHandExp;
      case "<":
        return <number>leftHandExp < <number>rightHandExp;
      case ">=":
        return <number>leftHandExp >= <number>rightHandExp;
      case ">":
        return <number>leftHandExp > <number>rightHandExp;
      case "+":
        return typeof leftHandExp === "number"
          ? <number>leftHandExp + <number>rightHandExp
          : <string>leftHandExp + <string>rightHandExp;
      case "-":
        return <number>leftHandExp - <number>rightHandExp;
      case "*":
        return <number>leftHandExp * <number>rightHandExp;
      case "/":
        return <number>leftHandExp / <number>rightHandExp;
      case "%":
        return <number>leftHandExp % <number>rightHandExp;
    }
  }
}
export class UnaryExpr extends Expr {
  operator: string;
  expr: Expr;

  constructor(type: Type, operator: string, expr: Expr) {
    super(type);
    this.operator = operator;
    this.expr = expr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.expr);
    return children;
  }

  print(): string {
    const opNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      opNodeId + '[label" ' + this.operator + ' "];\n',
    );
    const rightExprId = this.expr.print();
    dotString = dotString.concat(opNodeId + "->" + rightExprId + ";\n");
    return opNodeId;
  }

  evaluate(): unknown {
    const expression = getValueOfExpression(this.expr.evaluate(), varStacks);
    switch (this.operator) {
      case "+":
        return +(<number>expression);
      case "-":
        return -(<number>expression);
      case "!":
        return !(<boolean>expression);
    }
  }
}
export class FunDeclaration extends Expr {
  params: Parameter[];
  _body: Stmt;
  scope: Scope;

  constructor(type: Type, params: Parameter[], body: Stmt) {
    const paramTypes: Type[] = params.map((param) => param.stmtType);
    super(new FunctionType(type, paramTypes));
    this.params = params;
    this._body = body;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.stmtType);
    children.push(...this.params);
    children.push(this._body);
    return children;
  }

  print(): string {
    const anonymousFunDeclNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      anonymousFunDeclNodeId + '[label=" AnonFunDecl "];\n',
    );
    writeFunDeclarationDot(this, anonymousFunDeclNodeId);
    return anonymousFunDeclNodeId;
  }

  evaluate(): unknown {
    let returnValue = this._body.evaluate();
    if (returnValue instanceof Return && returnValue.possibleValue !== null)
      returnValue = getValueOfExpression(
        returnValue.possibleValue.evaluate(),
        varStacks,
      );
    popOutOfScopeVars(this, varStacks);
    return returnValue;
  }
}
export class ArrayAccess extends Expr {
  arrayExpr: Expr;
  accessExpr: Expr;

  constructor(arrayExpr: Expr, accessExpr: Expr) {
    super(null);
    this.arrayExpr = arrayExpr;
    this.accessExpr = accessExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.arrayExpr);
    children.push(this.accessExpr);
    return children;
  }

  print(): string {
    const arrayAccesseNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(arrayAccesseNodeId + '[label=" at "];\n');
    const arrayExprId = this.arrayExpr.print();
    const accessExprId = this.accessExpr.print();
    dotString = dotString.concat(
      arrayAccesseNodeId + "->" + arrayExprId + ";\n",
    );
    dotString = dotString.concat(
      arrayAccesseNodeId + "->" + accessExprId + ";\n",
    );
    return arrayAccesseNodeId;
  }

  evaluate(): unknown {
    const indices = new Array<number>();
    let arrayBase = <ArrayAccess>this;
    while (true) {
      indices.push(
        <number>(
          getValueOfExpression(arrayBase.accessExpr.evaluate(), varStacks)
        ),
      );
      if (!((<ArrayAccess>arrayBase).arrayExpr instanceof ArrayAccess)) break;
      arrayBase = <ArrayAccess>arrayBase.arrayExpr;
    }
    let returnArray = <unknown[]>(
      varStacks
        .get(
          <VarDeclaration | Parameter>(
            (<Identifier>arrayBase.arrayExpr).declaration
          ),
        )
        .at(-1)
    );
    while (indices.length > 1) {
      returnArray = <unknown[]>returnArray[indices.pop()];
    }
    return new ArrayRepresentation(returnArray, indices.pop());
  }
}
export class TypeCast extends Expr {
  castedExpr: Expr;

  constructor(desiredType: Type, castedExpr: Expr) {
    super(desiredType);
    this.castedExpr = castedExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.stmtType);
    children.push(this.castedExpr);
    return children;
  }

  print(): string {
    const typeCastNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(typeCastNodeId + '[label=" TypeCast "];\n');
    const desiredTypeNodeId = this.stmtType.print();
    const castedExprNodeId = this.castedExpr.print();
    dotString = dotString.concat(
      typeCastNodeId + "->" + desiredTypeNodeId + ";\n",
    );
    dotString = dotString.concat(
      typeCastNodeId + "->" + castedExprNodeId + ";\n",
    );
    return typeCastNodeId;
  }

  evaluate(): unknown {
    return this.castedExpr.evaluate();
  }
}
export class AttributeAccess extends Expr {
  containerExpr: Expr;
  callExpr: Expr;

  constructor(containerExpr: Expr, callExpr: Expr) {
    super(null);
    this.containerExpr = containerExpr;
    this.callExpr = callExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.containerExpr);
    children.push(this.callExpr);
    return children;
  }

  print(): string {
    const attributeAccessNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(attributeAccessNodeId + '[label=" . "];\n');
    const containerExprId = this.containerExpr.print();
    const callExprId = this.callExpr.print();
    dotString = dotString.concat(
      attributeAccessNodeId + "->" + containerExprId + ";\n",
    );
    dotString = dotString.concat(
      attributeAccessNodeId + "->" + callExprId + ";\n",
    );
    return attributeAccessNodeId;
  }

  evaluate(): unknown {
    return undefined;
  }
}
export class FunCall extends Expr {
  identifier: Expr;
  args: Expr[];

  constructor(type: Type, identifier: Expr, args: Expr[]) {
    super(type);
    this.identifier = identifier;
    this.args = args;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.identifier);
    if (this.args !== null) children.push(...this.args);
    return children;
  }

  print(): string {
    const funCallNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(funCallNodeId + '[label=" FunCall "];\n');
    const identifierNodeId = this.identifier.print();
    const argNodeIds = new Array<string>();
    this.args.forEach((arg) => argNodeIds.push(arg.print()));
    dotString = dotString.concat(
      funCallNodeId + "->" + identifierNodeId + ";\n",
    );
    argNodeIds.forEach(
      (nodeId) =>
        (dotString = dotString.concat(funCallNodeId + "->" + nodeId + ";\n")),
    );
    return funCallNodeId;
  }

  evaluate(): unknown {
    const identifier = this.identifier.evaluate();
    if (
      identifier instanceof Identifier &&
      libFunctions.has(<VarDeclaration>identifier.declaration)
    ) {
      return libFunctions.get(<VarDeclaration>identifier.declaration)(
        ...this.args.map((arg) =>
          getValueOfExpression(arg.evaluate(), varStacks),
        ),
      );
    }
    const funDecl = <FunDeclaration>(
      getValueOfExpression(this.identifier.evaluate(), varStacks)
    );
    this.args.forEach((arg, pos) => {
      const value = getValueOfExpression(arg.evaluate(), varStacks);
      const paramStack = varStacks.get((<FunDeclaration>funDecl).params[pos]);
      if (paramStack === undefined)
        varStacks.set((<FunDeclaration>funDecl).params[pos], [value]);
      else paramStack.push(value);
    });
    return funDecl.evaluate();
  }
}

export class StringLiteral extends Expr {
  value: string;

  constructor(value: string) {
    super(new BaseType(BaseTypeKind.STRING));
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const stringLiteralNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      stringLiteralNodeId + '[label=" ' + this.value + ' "];\n',
    );
    return stringLiteralNodeId;
  }

  evaluate(): unknown {
    return this.value;
  }
}
export class BoolLiteral extends Expr {
  value: boolean;

  constructor(value: boolean) {
    super(new BaseType(BaseTypeKind.BOOL));
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const boolLiteralNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      boolLiteralNodeId + '[label=" ' + this.value + ' "];\n',
    );
    return boolLiteralNodeId;
  }

  evaluate(): unknown {
    return this.value;
  }
}
export class NumberLiteral extends Expr {
  value: number;

  constructor(value: number) {
    super(new BaseType(BaseTypeKind.NUMBER));
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const numberLiteralNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      numberLiteralNodeId + '[label=" ' + this.value + ' "];\n',
    );
    return numberLiteralNodeId;
  }

  evaluate(): unknown {
    return this.value;
  }
}
export class NoneLiteral extends Expr {
  value: undefined;

  constructor() {
    super(new BaseType(BaseTypeKind.VOID));
    this.value = undefined;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const noneLiteralNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(noneLiteralNodeId + '[label= " None " ];\n');
    return noneLiteralNodeId;
  }

  evaluate(): unknown {
    return this.value;
  }
}
export class ArrayLiteral extends Expr {
  value: Expr[];

  constructor(value: Expr[]) {
    super(new ArrayType(new BaseType(BaseTypeKind.NONE), value.length));
    this.value = value;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.value);
    return children;
  }

  print(): string {
    const arrayNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(arrayNodeId + '[label=" Array "];\n');
    this.children()
      .map((child) => child.print())
      .forEach(
        (nodeId) =>
          (dotString = dotString.concat(arrayNodeId + "->" + nodeId + ";\n")),
      );
    return arrayNodeId;
  }

  evaluate(): unknown {
    return this.value.map((exp) =>
      getValueOfExpression(exp.evaluate(), varStacks),
    );
  }
}
export class Identifier extends Expr {
  value: string;
  declaration: VarDeclaration | Parameter | UnionDeclaration;

  constructor(value: string) {
    super(new BaseType(BaseTypeKind.NONE));
    this.value = value;
  }
  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const identifierNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      identifierNodeId + '[label=" ' + this.value + ' "];\n',
    );
    return identifierNodeId;
  }

  evaluate(): unknown {
    return this;
  }
}

//Dictionary of predefined functions implemented in TS to be called in TCShell
export const libFunctions = new Map<
  VarDeclaration,
  (...args: unknown[]) => unknown
>();

libFunctions.set(
  new VarDeclaration(
    new FunctionType(new BaseType(BaseTypeKind.VOID), [
      new BaseType(BaseTypeKind.ANY),
    ]),
    new Identifier("print"),
    new FunDeclaration(
      new BaseType(BaseTypeKind.VOID),
      [
        new Parameter(
          new BaseType(BaseTypeKind.ANY),
          new Identifier("message"),
        ),
      ],
      new Block([]),
    ),
  ),
  (...args) => console.log(args[0]),
);
libFunctions.set(
  new VarDeclaration(
    new FunctionType(new BaseType(BaseTypeKind.NUMBER), [
      new ArrayType(new BaseType(BaseTypeKind.ANY), -1),
    ]),
    new Identifier("len"),
    new FunDeclaration(
      new BaseType(BaseTypeKind.NUMBER),
      [
        new Parameter(
          new ArrayType(new BaseType(BaseTypeKind.ANY), -1),
          new Identifier("array"),
        ),
      ],
      new Block(new Array<Stmt>()),
    ),
  ),
  (...args) => (<unknown[]>args[0]).length,
);
