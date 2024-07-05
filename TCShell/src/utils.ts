import * as core from "./core/program.js";
import { MatchCondition, Program, varStacks } from "./core/program.js";
import {
  AliasTypeDeclaration,
  Block,
  CaseStmt,
  DeferDecorator,
  Parameter,
  RecordDeclaration,
  Stmt,
  UnionDeclaration,
  VarDeclaration,
} from "./core/stmts.js";
import * as engine from "../../SpatialComputingEngine/src/frontend-objects.js";
import { ImportSymbol, VarSymbol } from "./semantics.js";
import { Schema } from "redis-om";
import {
  BaseType,
  BaseTypeKind,
  BidirectionalDecorator,
  ControlledDecorator,
  DefaultBaseTypeInstance,
  FunDeclaration,
  MobileDecorator,
  NotControlledDecorator,
  PhysicalDecorator,
  RecordType,
  SpatialType,
  SpatialTypeDecorator,
  StationaryDecorator,
  Type,
  UnidirectionalDecorator,
  UnionType,
  VirtualDecorator,
} from "./core/index.js";
import { Identifier } from "./core/expr/Expr.js";

export function popOutOfScopeVars(
  node: Program | FunDeclaration | Block | CaseStmt | DeferDecorator,
) {
  node.scope.symbolTable.forEach((symbol) => {
    if (symbol instanceof VarSymbol) varStacks.get(symbol.varDeclaration).pop();
    if (symbol instanceof ImportSymbol)
      (symbol as ImportSymbol).importDeclaration.importedSymbols.forEach(
        (varDecl) => varStacks.get(varDecl).pop(),
      );
  });
}

export function getValueOfExpression(value: unknown): unknown {
  if (value instanceof Identifier) {
    value = varStacks.get(<VarDeclaration | Parameter>value.declaration).at(-1);
  } else if (value instanceof core.ArrayRepresentation)
    value = value.array[value.index];
  return value;
}

export function isAnyType(_type: core.RuntimeType): boolean {
  return _type instanceof BaseType && _type.kind === BaseTypeKind.ANY;
}

export function isWildcard(matchCondition: MatchCondition): boolean {
  return matchCondition instanceof Parameter && isAnyType(matchCondition.type);
}

export function isDecorator(_type: Type): _type is SpatialTypeDecorator {
  return "delegate" in _type;
}

export function isPublic(stmt: Stmt): boolean {
  return stmt instanceof VarDeclaration && stmt.isPublic;
}

export function getTypeDeclaration(identifier: Identifier): Type {
  if (identifier.declaration instanceof UnionDeclaration)
    return new UnionType(
      identifier,
      identifier.declaration.line,
      identifier.declaration.column,
    );
  if (identifier.declaration instanceof RecordDeclaration)
    return new RecordType(
      identifier,
      identifier.declaration.line,
      identifier.declaration.column,
    );
  if (identifier.declaration instanceof AliasTypeDeclaration)
    if (identifier.declaration.aliasedType instanceof Type)
      return identifier.declaration.aliasedType;
    else return getTypeDeclaration(identifier.declaration.aliasedType);
  return DefaultBaseTypeInstance.NONE;
}

export function getSpatialTypeSchema(
  spatialTypeEntity: engine.SpatialTypeEntity,
): Schema {
  return spatialTypeEntity instanceof engine.SpatialEntity
    ? engine.ENTITY_SCHEMA
    : spatialTypeEntity instanceof engine.Space
      ? engine.SPACE_SCHEMA
      : engine.PATH_SCHEMA;
}

export function parseSpatialTypeProperties(
  delegateType: SpatialType,
): Array<Map<string, string | boolean> | SpatialType> {
  const properties = new Map<string, string | boolean>();
  while (isDecorator(delegateType)) {
    if (delegateType instanceof PhysicalDecorator)
      properties.set("locality", "physical");
    if (delegateType instanceof VirtualDecorator)
      properties.set("locality", "virtual");
    if (delegateType instanceof ControlledDecorator)
      properties.set("isControlled", true);
    if (delegateType instanceof NotControlledDecorator)
      properties.set("isControlled", false);
    if (delegateType instanceof MobileDecorator)
      properties.set("motion", "mobile");
    if (delegateType instanceof StationaryDecorator)
      properties.set("motion", "stationary");
    if (delegateType instanceof UnidirectionalDecorator)
      properties.set("direction", "unidirectional");
    if (delegateType instanceof BidirectionalDecorator)
      properties.set("direction", "bidirectional");
    delegateType = delegateType.delegate;
  }
  return [properties, delegateType];
}

export function twoObjectsAreEquivalent(obj1: object, obj2: object): boolean {
  const obj1Entries = Object.entries(obj1);
  const obj2Entries = Object.entries(obj2);
  if (obj1Entries.length !== obj2Entries.length) return false;
  return (
    obj1Entries.filter((entry1, pos) => {
      if (entry1[0].toString() !== obj2Entries[pos][0]) return true;
      if (
        typeof entry1[1] === "object" &&
        typeof obj2Entries[pos][1] === "object"
      )
        return !twoObjectsAreEquivalent(entry1[1], obj2Entries[pos][1]);
      else return entry1[1] !== obj2Entries[pos][1];
    }).length === 0
  );
}
