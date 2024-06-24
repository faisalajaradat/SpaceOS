import * as core from "./core/core.js";
import * as engine from "../../SpatialComputingEngine/src/frontend-objects.js";
import {VarSymbol} from "./semantics.js";
import {Schema} from "redis-om";
import {
  BaseType,
  BaseTypeKind,
  ControlledDecorator,
  MobileDecorator,
  NotControlledDecorator,
  PhysicalDecorator,
  SpatialType,
  SpatialTypeDecorator,
  StationaryDecorator,
  Type,
  VirtualDecorator
} from "./core/type.js";
import {Block, CaseStmt, DeferredDecorator, FunDeclaration, Program, varStacks} from "./core/core.js";

export function popOutOfScopeVars(
    node: Program | FunDeclaration | Block | CaseStmt | DeferredDecorator,
) {
  node.scope.symbolTable.forEach((symbol) => {
    if (symbol instanceof VarSymbol) varStacks.get(symbol.varDeclaration).pop();
  });
}

export function getValueOfExpression(
    value: unknown,
): unknown {
  if (value instanceof core.Identifier) {
    value = varStacks
      .get(<core.VarDeclaration | core.Parameter>value.declaration)
      .at(-1);
  } else if (value instanceof core.ArrayRepresentation)
    value = value.array[value.index];
  return value;
}

export function isAnyType(_type: Type) {
  return _type instanceof BaseType && _type.kind === BaseTypeKind.ANY;
}

export function isWildcard(matchCondition: core.Parameter | core.Expr) {
  return (
    matchCondition instanceof core.Parameter &&
    isAnyType(matchCondition.stmtType)
  );
}

export function isDecorator(
  _type: Type,
): _type is SpatialTypeDecorator {
  return (_type as SpatialTypeDecorator).delegate !== undefined;
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
    delegateType = delegateType.delegate;
  }
  return [properties, delegateType];
}
