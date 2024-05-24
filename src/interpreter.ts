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
    let returnValue = evaluate(node.block);
    if (returnValue instanceof core.Identifier)
      returnValue = varStacks
        .get(<core.VarDeclaration | core.Parameter>returnValue.declaration)
        .at(-1);
    else if (returnValue instanceof ArrayRepresentation)
      returnValue = returnValue.array[returnValue.index];
    popOutOfScopeVars(node);
    return returnValue;
  } else if (node instanceof core.VarDeclaration) {
    let value = evaluate(node.value);
    if (value instanceof core.Identifier)
      value = varStacks
        .get(<core.VarDeclaration | core.Parameter>value.declaration)
        .at(-1);
    else if (value instanceof ArrayRepresentation)
      value = value.array[value.index];
    const varStack = varStacks.get(node);
    if (varStack === undefined) varStacks.set(node, [value]);
    else varStack.push(evaluate(node.value));
  } else if (node instanceof core.Return) return node;
  else if (node instanceof core.If) {
    let conditionValue = evaluate(node.condition);
    if (conditionValue instanceof core.Identifier)
      conditionValue = varStacks
        .get(<core.VarDeclaration | core.Parameter>conditionValue.declaration)
        .at(-1);
    else if (conditionValue instanceof ArrayRepresentation)
      conditionValue = conditionValue.array[conditionValue.index];
    if (<boolean>conditionValue) return evaluate(node.ifStmt);
    else if (node.possibleElseStmt !== null)
      return evaluate(node.possibleElseStmt);
  } else if (node instanceof core.While) {
    let conditionValue = evaluate(node.condition);
    if (conditionValue instanceof core.Identifier)
      conditionValue = varStacks
        .get(<core.VarDeclaration | core.Parameter>conditionValue.declaration)
        .at(-1);
    else if (conditionValue instanceof ArrayRepresentation)
      conditionValue = conditionValue.array[conditionValue.index];
    while (<boolean>conditionValue) return evaluate(node.whileStmt);
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
    let returnValue = evaluate(returnNode.possibleValue);
    if (returnValue instanceof core.Identifier)
      returnValue = varStacks
        .get(<core.VarDeclaration | core.Parameter>returnValue.declaration)
        .at(-1);
    else if (returnValue instanceof ArrayRepresentation)
      returnValue = returnValue.array[returnValue.index];
    popOutOfScopeVars(node);
    return returnValue;
  } else if (node instanceof core.BinaryExpr) {
    let leftHandExp = evaluate(node.leftExpr);
    let rightHandExp = evaluate(node.rightExpr);
    if (rightHandExp instanceof core.Identifier)
      rightHandExp = varStacks
        .get(<core.VarDeclaration | core.Parameter>rightHandExp.declaration)
        .at(-1);
    else if (rightHandExp instanceof ArrayRepresentation)
      rightHandExp = rightHandExp.array[rightHandExp.index];
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
    if (leftHandExp instanceof core.Identifier)
      leftHandExp = varStacks
        .get(<core.VarDeclaration | core.Parameter>leftHandExp.declaration)
        .at(-1);
    else if (leftHandExp instanceof ArrayRepresentation)
      leftHandExp = leftHandExp.array[leftHandExp.index];
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
    let expression = evaluate(node.expr);
    if (expression instanceof core.Identifier)
      expression = varStacks
        .get(<core.VarDeclaration | core.Parameter>expression.declaration)
        .at(-1);
    else if (expression instanceof ArrayRepresentation)
      expression = expression.array[expression.index];
    switch (node.operator) {
      case "+":
        return +(<number>expression);
      case "-":
        return -(<number>expression);
      case "!":
        return !(<boolean>expression);
    }
  } else if (node instanceof core.FunCall) {
    if (node.identifier.value === "print") {
      let message = evaluate(node.args[0]);
      if (message instanceof core.Identifier)
        message = varStacks
          .get(<core.VarDeclaration | core.Parameter>message.declaration)
          .at(-1);
      else if (message instanceof ArrayRepresentation)
        message = message.array[message.index];
      console.log(message);
    }
    node.args.forEach((arg, pos) => {
      let value = evaluate(arg);
      if (value instanceof core.Identifier)
        value = varStacks
          .get(<core.VarDeclaration | core.Parameter>value.declaration)
          .at(-1);
      else if (value instanceof ArrayRepresentation)
        value = value.array[value.index];
      const paramStack = varStacks.get(
        (<core.FunDeclaration>node.identifier.declaration).params[pos],
      );
      if (paramStack === undefined)
        varStacks.set(
          (<core.FunDeclaration>node.identifier.declaration).params[pos],
          [value],
        );
      else paramStack.push(value);
    });
    return evaluate(node.identifier.declaration);
  } else if (node instanceof core.StringLiteral) return node.value;
  else if (node instanceof core.BoolLiteral) return node.value;
  else if (node instanceof core.NumberLiteral) return node.value;
  else if (node instanceof core.Identifier) return node;
  else if (node instanceof core.ArrayLiteral) {
    return node.value.map((exp) => {
      let returnValue = evaluate(exp);
      if (returnValue instanceof core.Identifier)
        varStacks
          .get(<core.VarDeclaration | core.Parameter>returnValue.declaration)
          .at(-1);
      else if (returnValue instanceof ArrayRepresentation)
        returnValue = returnValue.array[returnValue.index];
      return returnValue;
    });
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
