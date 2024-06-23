import * as core from "./core.js";
import * as engine from "../../SpatialComputingEngine/src/FrontendObjects.js";
import { VarSymbol } from "./semantics.js";
import { Schema } from "redis-om";

export function popOutOfScopeVars(
  node:
    | core.Program
    | core.FunDeclaration
    | core.Block
    | core.CaseStmt
    | core.DeferredDecorator,
  varStacks: Map<core.VarDeclaration | core.Parameter, unknown[]>,
) {
  node.scope.symbolTable.forEach((symbol) => {
    if (symbol instanceof VarSymbol) varStacks.get(symbol.varDeclaration).pop();
  });
}

export function getValueOfExpression(
  value: unknown,
  varStacks: Map<core.VarDeclaration | core.Parameter, unknown[]>,
): unknown {
  if (value instanceof core.Identifier) {
    value = varStacks
      .get(<core.VarDeclaration | core.Parameter>value.declaration)
      .at(-1);
  } else if (value instanceof core.ArrayRepresentation)
    value = value.array[value.index];
  return value;
}

export function isAnyType(_type: core.Type) {
  return _type instanceof core.BaseType && _type.kind === core.BaseTypeKind.ANY;
}

export function isWildcard(matchCondition: core.Parameter | core.Expr) {
  return (
    matchCondition instanceof core.Parameter &&
    isAnyType(matchCondition.stmtType)
  );
}

export function isDecorator(
  _type: core.Type,
): _type is core.SpatialTypeDecorator {
  return (_type as core.SpatialTypeDecorator).delegate !== undefined;
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
  delegateType: core.SpatialType,
): Array<Map<string, string | boolean> | core.SpatialType> {
  const properties = new Map<string, string | boolean>();
  while (isDecorator(delegateType)) {
    if (delegateType instanceof core.PhysicalDecorator)
      properties.set("locality", "physical");
    if (delegateType instanceof core.VirtualDecorator)
      properties.set("locality", "virtual");
    if (delegateType instanceof core.ControlledDecorator)
      properties.set("isControlled", true);
    if (delegateType instanceof core.NotControlledDecorator)
      properties.set("isControlled", false);
    if (delegateType instanceof core.MobileDecorator)
      properties.set("motion", "mobile");
    if (delegateType instanceof core.StationaryDecorator)
      properties.set("motion", "stationary");
    delegateType = delegateType.delegate;
  }
  return [properties, delegateType];
}
