import * as core from "./core.js";
import { VarSymbol, FunSymbol } from "./semantics.js";

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
  node: core.Program | core.FunDeclaration | core.Block,
) {
  if (
    node instanceof core.FunDeclaration &&
    core.libFunctions.lastIndexOf(node) != -1
  )
    return;
  node.scope.symbolTable.forEach((symbol) => {
    if (symbol instanceof FunSymbol) return;
    varStacks.get((<VarSymbol>symbol).varDeclaration).pop();
  });
}

function getValueOfExpression(value: unknown): unknown {
  if (value instanceof core.Identifier)
    value = varStacks
      .get(<core.VarDeclaration | core.Parameter>value.declaration)
      .at(-1);
  else if (value instanceof ArrayRepresentation)
    value = value.array[value.index];
  return value;
}

export default function interpetProgram(node: core.Program) {
  evaluate(node);
}

function evaluate(node: core.ASTNode): unknown {
  if (node instanceof core.Program) {
    node
      .children()
      .filter((child) => child instanceof core.Stmt)
      .forEach((stmt) => evaluate(stmt));
    popOutOfScopeVars(node);
  } else if (node instanceof core.FunDeclaration) {
    if (core.libFunctions.has(node)) {
      const args = node.params.map((param) => varStacks.get(param).pop());
      return core.libFunctions.get(node)(args);
    }
    const returnValue = getValueOfExpression(evaluate(node.block));
    popOutOfScopeVars(node);
    return returnValue;
  } else if (node instanceof core.VarDeclaration) {
    const value = getValueOfExpression(evaluate(node.value));
    const varStack = varStacks.get(node);
    if (varStack === undefined) varStacks.set(node, [value]);
    else varStack.push(evaluate(node.value));
  } else if (node instanceof core.Return) return node;
  else if (node instanceof core.If) {
    if (<boolean>getValueOfExpression(evaluate(node.condition)))
      return evaluate(node.ifStmt);
    else if (node.possibleElseStmt !== null)
      return evaluate(node.possibleElseStmt);
  } else if (node instanceof core.While) {
    while (<boolean>getValueOfExpression(evaluate(node.condition)))
      return evaluate(node.whileStmt);
  } else if (node instanceof core.Block) {
    let returnNode = undefined;
    for (let i = 0; i < node.stmts.length; i++) {
      returnNode = evaluate(node.stmts[i]);
      if (returnNode instanceof core.Return) break;
    }
    if (
      !(returnNode instanceof core.Return) ||
      returnNode.possibleValue === null
    )
      return undefined;
    const returnValue = getValueOfExpression(
      evaluate(returnNode.possibleValue),
    );
    popOutOfScopeVars(node);
    return returnValue;
  } else if (node instanceof core.BinaryExpr) {
    let leftHandExp = evaluate(node.leftExpr);
    const rightHandExp = getValueOfExpression(evaluate(node.rightExpr));
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
    const funDecl = <core.FunDeclaration>node.identifier.declaration;
    node.args.forEach((arg, pos) => {
      const value = getValueOfExpression(evaluate(arg));
      const paramStack = varStacks.get(funDecl.params[pos]);
      if (paramStack === undefined) varStacks.set(funDecl.params[pos], [value]);
      else paramStack.push(value);
    });
    return evaluate(funDecl);
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
      indices.push(<number>evaluate(arrayBase.accessExpr));
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
