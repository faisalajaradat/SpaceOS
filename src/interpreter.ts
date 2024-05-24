import * as core from "./core.js";
import { VarSymbol, FunSymbol } from "./semantics.js";

const varStacks = new Map<core.VarDeclaration | core.Parameter, unknown[]>();

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
    const returnValue = evaluate(node.block);
    popOutOfScopeVars(node);
    return returnValue;
  } else if (node instanceof core.VarDeclaration) {
    const value = evaluate(node.value);
    const varStack = varStacks.get(node);
    if (varStack === undefined) varStacks.set(node, [value]);
    else varStack.push(evaluate(node.value));
  } else if (node instanceof core.Return) return node;
  else if (node instanceof core.If) {
    if (<boolean>evaluate(node.condition)) return evaluate(node.ifStmt);
    else if (node.possibleElseStmt !== null)
      return evaluate(node.possibleElseStmt);
  } else if (node instanceof core.While) {
    while (<boolean>evaluate(node.condition)) return evaluate(node.whileStmt);
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
    popOutOfScopeVars(node);
    return returnValue;
  } else if (node instanceof core.BinaryExpr) {
    let leftHandExp = evaluate(node.leftExpr);
    let rightHandExp = evaluate(node.rightExpr);
    if (rightHandExp instanceof core.Identifier)
      rightHandExp = varStacks
        .get(<core.VarDeclaration | core.Parameter>rightHandExp.declaration)
        .at(-1);
    if (node.operator === "=") {
      const varStack = varStacks.get(
        <core.VarDeclaration | core.Parameter>(
          (<core.Identifier>leftHandExp).declaration
        ),
      );
      varStack[varStack.length - 1] = rightHandExp;
      return rightHandExp;
    }
    if (leftHandExp instanceof core.Identifier)
      leftHandExp = varStacks
        .get(<core.VarDeclaration | core.Parameter>leftHandExp.declaration)
        .at(-1);
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
      const message = evaluate(node.args[0]);
      console.log(
        message instanceof core.Identifier
          ? varStacks
              .get(<core.VarDeclaration | core.Parameter>message.declaration)
              .at(-1)
          : message,
      );
    }
    node.args.forEach((arg, pos) => {
      let value = evaluate(arg);
      if (value instanceof core.Identifier)
        value = varStacks
          .get(<core.VarDeclaration | core.Parameter>value.declaration)
          .at(-1);
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
      const returnValue = evaluate(exp);
      return returnValue instanceof core.Identifier
        ? varStacks
            .get(<core.VarDeclaration | core.Parameter>returnValue.declaration)
            .at(-1)
        : returnValue;
    });
  }
  return undefined;
}
