import * as core from "./core.js";
import { VarSymbol } from "./semantics.js";

export function popOutOfScopeVars(
  node: core.Program | core.FunDeclaration | core.Block | core.CaseStmt,
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
