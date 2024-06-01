import * as core from "./core.js";
import { VarSymbol, FunSymbol } from "./semantics.js";

//A map variable declaration and their stack of assigned values
const varStacks = new Map<core.VarDeclaration | core.Parameter, unknown[]>();

class ArrayRepresentation {
  array: unknown[];
  index: number;

  constructor(array: unknown[], index: number) {
    this.array = array;
    this.index = index;
  }
}

function popOutOfScopeVars(
  node:
    | core.Program
    | core.FunDeclaration
    | core.Block
    | core.AnonymousFunDeclaration,
) {
  node.scope.symbolTable.forEach((symbol) => {
    if (symbol instanceof FunSymbol) return;
    varStacks.get((<VarSymbol>symbol).varDeclaration).pop();
  });
}

function getValueOfExpression(value: unknown): unknown {
  if (value instanceof core.Identifier) {
    if (value.declaration instanceof core.FunDeclaration)
      return value.declaration;
    value = varStacks
      .get(<core.VarDeclaration | core.Parameter>value.declaration)
      .at(-1);
  } else if (value instanceof ArrayRepresentation)
    value = value.array[value.index];
  return value;
}

export default function interpetProgram(node: core.Program) {
  evaluate(node);
}

//Recursive AST walker for interpreting
function evaluate(node: core.ASTNode): unknown {
  if (node instanceof core.Program) {
    node
      .children()
      .filter((child) => !(child instanceof core.FunDeclaration))
      .forEach((stmt) => evaluate(stmt));
    popOutOfScopeVars(node);
  } else if (
    node instanceof core.FunDeclaration ||
    node instanceof core.AnonymousFunDeclaration
  ) {
    if (node instanceof core.FunDeclaration && core.libFunctions.has(node)) {
      const args = node.params.map((param) => varStacks.get(param).pop());
      return core.libFunctions.get(node)(...args);
    }
    let returnValue = evaluate(node._body);
    if (
      returnValue instanceof core.Return &&
      returnValue.possibleValue !== null
    )
      returnValue = getValueOfExpression(evaluate(returnValue.possibleValue));
    popOutOfScopeVars(node);
    return returnValue;
  } else if (node instanceof core.VarDeclaration) {
    const value =
      node.value instanceof core.AnonymousFunDeclaration
        ? node.value
        : getValueOfExpression(evaluate(node.value));
    const varStack = varStacks.get(node);
    if (varStack === undefined) varStacks.set(node, [value]);
    else varStack.push(value);
  } else if (node instanceof core.Return) return node;
  else if (node instanceof core.If) {
    if (<boolean>getValueOfExpression(evaluate(node.condition)))
      return evaluate(node.ifStmt);
    else if (node.possibleElseStmt !== null)
      return evaluate(node.possibleElseStmt);
  } else if (node instanceof core.While) {
    let returnValue = undefined;
    while (<boolean>getValueOfExpression(evaluate(node.condition)))
      returnValue = evaluate(node.whileStmt);
    return returnValue;
  } else if (node instanceof core.Block) {
    let returnNode = undefined;
    for (let i = 0; i < node.stmts.length; i++) {
      returnNode = evaluate(node.stmts[i]);
      if (returnNode instanceof core.Return) break;
    }
    if (returnNode instanceof core.Return && returnNode.possibleValue !== null)
      returnNode = getValueOfExpression(evaluate(returnNode.possibleValue));
    popOutOfScopeVars(node);
    return returnNode;
  } else if (node instanceof core.BinaryExpr) {
    let leftHandExp = evaluate(node.leftExpr);
    const rightHandExp =
      node.rightExpr instanceof core.AnonymousFunDeclaration
        ? node.rightExpr
        : getValueOfExpression(evaluate(node.rightExpr));
    if (node.operator === "=") {
      if (leftHandExp instanceof core.Identifier) {
        const varStack = varStacks.get(
          <core.VarDeclaration | core.Parameter>(
            (<core.Identifier>leftHandExp).declaration
          ),
        );
        varStack[varStack.length - 1] = rightHandExp;
      } else if (leftHandExp instanceof ArrayRepresentation)
        leftHandExp.array[leftHandExp.index] = rightHandExp;
      return rightHandExp;
    }
    leftHandExp = getValueOfExpression(leftHandExp);
    switch (node.operator) {
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
  } else if (node instanceof core.UnaryExpr) {
    const expression = getValueOfExpression(evaluate(node.expr));
    switch (node.operator) {
      case "+":
        return +(<number>expression);
      case "-":
        return -(<number>expression);
      case "!":
        return !(<boolean>expression);
    }
  } else if (node instanceof core.FunCall) {
    const funDecl = <core.FunDeclaration | core.AnonymousFunDeclaration>(
      getValueOfExpression(evaluate(node.identifier))
    );
    node.args.forEach((arg, pos) => {
      const value = getValueOfExpression(evaluate(arg));
      const paramStack = varStacks.get(
        (<core.FunDeclaration | core.AnonymousFunDeclaration>funDecl).params[
          pos
        ],
      );
      if (paramStack === undefined)
        varStacks.set(
          (<core.FunDeclaration | core.AnonymousFunDeclaration>funDecl).params[
            pos
          ],
          [value],
        );
      else paramStack.push(value);
    });
    return evaluate(
      <core.FunDeclaration | core.AnonymousFunDeclaration>funDecl,
    );
  } else if (node instanceof core.StringLiteral) return node.value;
  else if (node instanceof core.BoolLiteral) return node.value;
  else if (node instanceof core.NumberLiteral) return node.value;
  else if (node instanceof core.Identifier) return node;
  else if (node instanceof core.ArrayLiteral) {
    return node.value.map((exp) => getValueOfExpression(evaluate(exp)));
  } else if (node instanceof core.ArrayAccess) {
    const indices = new Array<number>();
    let arrayBase = node;
    while (true) {
      indices.push(
        <number>getValueOfExpression(evaluate(arrayBase.accessExpr)),
      );
      if (
        !((<core.ArrayAccess>arrayBase).arrayExpr instanceof core.ArrayAccess)
      )
        break;
      arrayBase = <core.ArrayAccess>arrayBase.arrayExpr;
    }
    let returnArray = <unknown[]>(
      varStacks
        .get(
          <core.VarDeclaration | core.Parameter>(
            (<core.Identifier>arrayBase.arrayExpr).declaration
          ),
        )
        .at(-1)
    );
    while (indices.length > 1) {
      returnArray = <unknown[]>returnArray[indices.pop()];
    }
    return new ArrayRepresentation(returnArray, indices.pop());
  }
  return undefined;
}
