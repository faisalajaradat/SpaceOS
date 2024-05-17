import * as core from "./core.js";

let symbolTable = new Map<string, string | number | boolean>();
const functionTable = new Map<string, core.FunDeclaration>();
let getIdentifier = false;
let alreadyScoped = false;

export function interpret(node: core.ASTNode): string | number | boolean {
  if (node instanceof core.Program) {
    node.children().forEach((child) => interpret(child));
    return true;
  }
  if (node instanceof core.FunDeclaration) {
    const saveState = getIdentifier;
    getIdentifier = true;
    functionTable.set(<string>interpret(node.identifier), node);
    getIdentifier = saveState;
    return true;
  }
  if (node instanceof core.VarDeclaration) {
    const saveState = getIdentifier;
    getIdentifier = true;
    const leftExpr = <string>interpret(node.identifier);
    getIdentifier = false;
    const rightExpr = interpret(node.value);
    getIdentifier = saveState;
    symbolTable.set(leftExpr, rightExpr);
    return true;
  }
  if (node instanceof core.Return) {
    const returnValue =
      node.possibleValue != null ? interpret(node.possibleValue) : true;
    return returnValue;
  }
  if (node instanceof core.If) {
    if (interpret(node.condition)) return interpret(node.ifStmt);
    else if (node.possibleElseStmt != null)
      return interpret(node.possibleElseStmt);
    return true;
  }
  if (node instanceof core.While) {
    while (interpret(node.condition)) interpret(node.whileStmt);
    return true;
  }
  if (node instanceof core.Block) {
    const upperSymbolTable = symbolTable;
    const saveState = alreadyScoped;
    alreadyScoped = false;
    if (!saveState) symbolTable = new Map<string, string | number | boolean>();
    let returnValue = null;
    node.stmts.forEach((stmt) => {
      if (stmt instanceof core.Return) returnValue = interpret(stmt);
      else interpret(stmt);
    });
    if (!saveState) symbolTable = upperSymbolTable;
    alreadyScoped = saveState;
    return returnValue != null ? returnValue : true;
  }
  if (node instanceof core.BinaryExpr) {
    const saveState = getIdentifier;
    getIdentifier = node.operator === "=";
    const leftExpr = interpret(node.leftExpr);
    getIdentifier = false;
    const rightExpr = interpret(node.rightExpr);
    getIdentifier = saveState;
    switch (node.operator) {
      case "=": {
        symbolTable.set(<string>leftExpr, rightExpr);
        return rightExpr;
      }
      case "||": {
        return leftExpr || rightExpr;
      }
      case "&&": {
        return leftExpr && rightExpr;
      }
      case "==": {
        return leftExpr == rightExpr;
      }
      case "!=": {
        return leftExpr != rightExpr;
      }
      case "<=": {
        return leftExpr <= rightExpr;
      }
      case "<": {
        return leftExpr < rightExpr;
      }
      case ">=": {
        return leftExpr >= rightExpr;
      }
      case ">": {
        return leftExpr > rightExpr;
      }
      case "+": {
        return <number>leftExpr + <number>rightExpr;
      }
      case "-": {
        return <number>leftExpr - <number>rightExpr;
      }
      case "*": {
        return <number>leftExpr * <number>rightExpr;
      }
      case "/": {
        return <number>leftExpr / <number>rightExpr;
      }
    }
  }
  if (node instanceof core.UnaryExpr) {
    const saveState = getIdentifier;
    getIdentifier = false;
    const expression = interpret(node.expr);
    getIdentifier = saveState;
    if (node.operator === "+") return +expression;
    if (node.operator === "-") return -expression;
  }
  if (node instanceof core.FunCall) {
    const saveState = alreadyScoped;
    const upperSymbolTable = symbolTable;
    alreadyScoped = true;
    symbolTable = new Map<string, string | number | boolean>();
    const saveIdentifierState = getIdentifier;
    getIdentifier = true;
    const identifier = <string>interpret(node.identifier);
    getIdentifier = false;
    if (identifier === "print") {
      console.log(interpret(node.args[0]));
      return;
    }
    const funDecl = functionTable.get(identifier);
    for (let i = 0; i < node.args.length; i++) {
      const value = interpret(node.args[i]);
      getIdentifier = true;
      const identifier = interpret(funDecl.argIdentifiers[i]);
      getIdentifier = false;
      symbolTable.set(<string>identifier, value);
    }
    const returnValue = interpret(funDecl.block);
    getIdentifier = saveIdentifierState;
    symbolTable = upperSymbolTable;
    return funDecl.funType != "void" ? returnValue : true;
  }
  if (node instanceof core.StringLiteral) return node.value;

  if (node instanceof core.BoolLiteral) return node.value;

  if (node instanceof core.NumberLiteral) return node.value;
  if (node instanceof core.Identifier)
    return getIdentifier ? node.value : symbolTable.get(node.value);
}
