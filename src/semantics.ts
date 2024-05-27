import * as core from "./core.js";

export default function analyze(astHead: core.Program): number {
  visitNameAnalyzer(astHead, null);
  visitTypeAnalyzer(astHead);
  return errors;
}

export abstract class ProgramSymbol {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export class VarSymbol extends ProgramSymbol {
  varDeclaration: core.VarDeclaration | core.Parameter;

  constructor(varDeclaration: core.VarDeclaration | core.Parameter) {
    super(varDeclaration.identifier.value);
    this.varDeclaration = varDeclaration;
  }
}

export class FunSymbol extends ProgramSymbol {
  funDeclaration: core.FunDeclaration;

  constructor(funDeclaration: core.FunDeclaration) {
    super(funDeclaration.identifier.value);
    this.funDeclaration = funDeclaration;
  }
}

export class Scope {
  outer: Scope;
  symbolTable: Map<string, ProgramSymbol>;

  constructor(outer: Scope) {
    this.outer = outer;
    this.symbolTable = new Map<string, ProgramSymbol>();
  }

  lookup(name: string): ProgramSymbol {
    const programSymbol = this.lookupCurrent(name);
    if (programSymbol !== null) return programSymbol;
    if (this.outer === null) return null;
    return this.outer.lookup(name);
  }

  lookupCurrent(name: string): ProgramSymbol {
    const programSymbol = this.symbolTable.get(name);
    if (programSymbol !== undefined) return programSymbol;
    return null;
  }

  put(programSymbol: ProgramSymbol) {
    this.symbolTable.set(programSymbol.name, programSymbol);
  }
}

let errors = 0;

function visitNameAnalyzer(node: core.ASTNode, scope: Scope) {
  if (node instanceof core.Program) {
    const curScope = new Scope(scope);
    core.libFunctions.forEach((value, fun) => {
      fun.identifier.declaration = fun;
      curScope.put(new FunSymbol(fun));
    });
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
    node.scope = curScope;
  } else if (node instanceof core.FunDeclaration) {
    const funSymbol = scope.lookupCurrent(node.identifier.value);
    if (funSymbol !== null) {
      errors++;
      console.log(
        "Function name: " +
          node.identifier.value +
          "already defined within scope!",
      );
    } else scope.put(new FunSymbol(node));
    const curScope = new Scope(scope);
    node.params.forEach((param) => visitNameAnalyzer(param, curScope));
    visitNameAnalyzer(node.block, curScope);
    node.scope = curScope;
  } else if (
    node instanceof core.VarDeclaration ||
    node instanceof core.Parameter
  ) {
    if (node instanceof core.VarDeclaration)
      visitNameAnalyzer(node.value, scope);
    const paramSymbol = scope.lookupCurrent(node.identifier.value);
    if (paramSymbol !== null) {
      errors++;
      console.log(
        "Variable name: " +
          node.identifier.value +
          " already defined within scope!",
      );
    } else scope.put(new VarSymbol(node));
  } else if (node instanceof core.Block) {
    const curScope = new Scope(scope);
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
    node.scope = curScope;
  } else if (node instanceof core.Identifier) {
    const programSymbol = scope.lookup(node.value);
    if (programSymbol === null) {
      errors++;
      console.log("Symbol: " + node.value + " has not been declared!");
      return;
    } else if (programSymbol instanceof FunSymbol)
      node.declaration = programSymbol.funDeclaration;
    else if (programSymbol instanceof VarSymbol)
      node.declaration = programSymbol.varDeclaration;
  } else node.children().forEach((child) => visitNameAnalyzer(child, scope));
}

let returnFunction: core.FunDeclaration = null;
const voidType = new core.BaseType(core.BaseTypeKind.VOID);
const numberType = new core.BaseType(core.BaseTypeKind.NUMBER);
const boolType = new core.BaseType(core.BaseTypeKind.BOOL);
const stringType = new core.BaseType(core.BaseTypeKind.STRING);

function typesAreEqual(type1: core.Type, type2: core.Type): boolean {
  if (type1 instanceof core.BaseType && type2 instanceof core.BaseType)
    return (
      type1.kind === type2.kind ||
      type1.kind === core.BaseTypeKind.ANY ||
      type2.kind === core.BaseTypeKind.ANY
    );
  if (type1 instanceof core.ArrayType && type2 instanceof core.ArrayType) {
    let type1Base: core.Type = type1;
    let type2Base: core.Type = type2;
    while (
      type1Base instanceof core.ArrayType &&
      type2Base instanceof core.ArrayType
    ) {
      type1Base = type1Base.type;
      type2Base = type2Base.type;
    }
    return typesAreEqual(type1Base, type2Base);
  }
  return false;
}

function conditionIsValidType(node: core.If | core.While): boolean {
  const conditionType = visitTypeAnalyzer(node.condition);
  if (!typesAreEqual(conditionType, boolType)) {
    errors++;
    console.log("Invalid condition expression type!");
    return false;
  }
  return true;
}

function visitTypeAnalyzer(node: core.ASTNode): core.Type {
  if (node instanceof core.FunDeclaration) {
    const oldFunDeclaration = returnFunction;
    returnFunction = node;
    visitTypeAnalyzer(node.block);
    returnFunction = oldFunDeclaration;
    node.params.forEach((param) => visitTypeAnalyzer(param));
  } else if (
    node instanceof core.VarDeclaration ||
    node instanceof core.Parameter
  ) {
    if (typesAreEqual(node.stmtType, voidType)) {
      errors++;
      console.log("Var: " + node.identifier.value + " cannot be type void!");
    } else if (node instanceof core.VarDeclaration) {
      const valueType = visitTypeAnalyzer(node.value);
      if (
        !typesAreEqual(node.stmtType, valueType) &&
        !(
          node.value instanceof core.ArrayLiteral &&
          valueType instanceof core.BaseType &&
          valueType.kind === core.BaseTypeKind.NONE
        )
      ) {
        errors++;
        console.log("Both sides of assignment must be the same type!");
      } else node.value.stmtType = node.stmtType;
    }
  } else if (node instanceof core.Return) {
    if (node.possibleValue === null) {
      if (!typesAreEqual(returnFunction.funType, voidType)) {
        errors++;
        console.log("Function is not type void!");
      }
    } else {
      const returnType: core.Type = visitTypeAnalyzer(node.possibleValue);
      if (!typesAreEqual(returnType, returnFunction.funType)) {
        errors++;
        console.log("Incorrect return type");
      }
    }
  } else if (node instanceof core.If) {
    if (conditionIsValidType(node)) {
      visitTypeAnalyzer(node.ifStmt);
      if (node.possibleElseStmt !== null)
        visitTypeAnalyzer(node.possibleElseStmt);
    }
  } else if (node instanceof core.While) {
    if (conditionIsValidType(node)) visitTypeAnalyzer(node.whileStmt);
  } else if (node instanceof core.BinaryExpr) {
    const leftHandType = visitTypeAnalyzer(node.leftExpr);
    const rightHandType = visitTypeAnalyzer(node.rightExpr);
    switch (node.operator) {
      case "+":
        if (
          (typesAreEqual(leftHandType, numberType) &&
            typesAreEqual(rightHandType, numberType)) ||
          (typesAreEqual(leftHandType, stringType) &&
            typesAreEqual(rightHandType, stringType))
        ) {
          node.stmtType = typesAreEqual(leftHandType, numberType)
            ? new core.BaseType(core.BaseTypeKind.NUMBER)
            : new core.BaseType(core.BaseTypeKind.STRING);
          return node.stmtType;
        }
        errors++;
        console.log(
          "The + operator can only be used on expressions of the same type that are either numbers or strings!",
        );
        break;
      case "-":
      case "*":
      case "/":
      case "%":
      case ">":
      case ">=":
      case "<":
      case "<=":
        if (
          typesAreEqual(leftHandType, numberType) &&
          typesAreEqual(rightHandType, numberType)
        ) {
          const operatorCreatesBool =
            node.operator === ">" ||
            node.operator === ">=" ||
            node.operator === "<" ||
            node.operator === "<=";
          node.stmtType = operatorCreatesBool
            ? new core.BaseType(core.BaseTypeKind.BOOL)
            : new core.BaseType(core.BaseTypeKind.NUMBER);
          return node.stmtType;
        }
        errors++;
        console.log(
          "Can only use the " + node.operator + "operator on numbers!",
        );
        break;
      case "==":
      case "!=":
        node.stmtType = new core.BaseType(core.BaseTypeKind.BOOL);
        return node.stmtType;
        break;
      case "||":
      case "&&":
        if (
          typesAreEqual(leftHandType, boolType) &&
          typesAreEqual(rightHandType, boolType)
        ) {
          node.stmtType = new core.BaseType(core.BaseTypeKind.BOOL);
          return node.stmtType;
        }
        errors++;
        console.log(
          "The " + node.operator + " operator can only be used with type bool!",
        );
        break;
      case "=":
        if (
          !(node.leftExpr instanceof core.Identifier) &&
          !(node.leftExpr instanceof core.ArrayAccess)
        ) {
          errors++;
          console.log("Left-hand side of assignment must be an lvalue!");
          break;
        } else if (
          !typesAreEqual(leftHandType, rightHandType) &&
          !(
            node.rightExpr instanceof core.ArrayLiteral &&
            rightHandType instanceof core.BaseType &&
            rightHandType.kind === core.BaseTypeKind.NONE
          )
        ) {
          errors++;
          console.log("Both sides of assigment must be same type!");
          break;
        } else {
          node.stmtType = leftHandType;
          node.rightExpr.stmtType = node.stmtType;
          return node.stmtType;
        }
    }
  } else if (node instanceof core.UnaryExpr) {
    const expType = visitTypeAnalyzer(node.expr);
    if (
      (node.operator === "+" || node.operator === "-") &&
      !typesAreEqual(expType, numberType)
    ) {
      errors++;
      console.log("Can only use the " + node.operator + " on numbers!");
    } else if (node.operator === "!" && !typesAreEqual(expType, boolType)) {
      errors++;
      console.log("Can only use the " + node.operator + " on bools!");
    } else {
      node.stmtType =
        node.operator === "!"
          ? new core.BaseType(core.BaseTypeKind.BOOL)
          : new core.BaseType(core.BaseTypeKind.NUMBER);
      return node.stmtType;
    }
  } else if (node instanceof core.ArrayAccess) {
    const indexType = visitTypeAnalyzer(node.accessExpr);
    if (!typesAreEqual(indexType, numberType)) {
      errors++;
      console.log("Index must be type number!");
    } else {
      const arrayElementType = visitTypeAnalyzer(node.arrayExpr);
      if (arrayElementType instanceof core.ArrayType) {
        node.stmtType = arrayElementType;
        return node.stmtType;
      }
      errors++;
      console.log("Cannot access type that is not an array!");
    }
  } else if (node instanceof core.FunCall) {
    const funDeclaration = <core.FunDeclaration>node.identifier.declaration;
    if (node.args.length !== funDeclaration.params.length) {
      errors++;
      console.log(
        "Funtion " +
          node.identifier.value +
          " called with incorrect number of arguments!",
      );
      return new core.BaseType(core.BaseTypeKind.NONE);
    }
    const argParamIncorrectTypingPairArray = node.args
      .map((arg, pos) => {
        return { arg: arg, param: funDeclaration.params[pos] };
      })
      .filter(
        (pair) =>
          !typesAreEqual(visitTypeAnalyzer(pair.arg), pair.param.stmtType),
      );
    if (argParamIncorrectTypingPairArray.length === 0) {
      node.stmtType = funDeclaration.funType;
      return node.stmtType;
    }
    argParamIncorrectTypingPairArray.forEach((pair) => {
      errors++;
      console.log(
        "Function " +
          node.identifier.value +
          " called with argument not matching paramater " +
          pair.param.identifier.value +
          " type!",
      );
    });
  } else if (
    node instanceof core.StringLiteral ||
    node instanceof core.BoolLiteral ||
    node instanceof core.NumberLiteral ||
    node instanceof core.Parameter
  )
    return node.stmtType;
  else if (node instanceof core.ArrayLiteral) {
    if (node.value.length === 0) return node.stmtType;
    node.stmtType = new core.ArrayType(visitTypeAnalyzer(node.value[0]));
    const listOfArraysIncorrectTypes = node.value.filter(
      (exp) =>
        !typesAreEqual(
          (<core.ArrayType>node.stmtType).type,
          visitTypeAnalyzer(exp),
        ),
    );
    if (listOfArraysIncorrectTypes.length === 0) return node.stmtType;
    listOfArraysIncorrectTypes.forEach(() => {
      errors++;
      console.log("Array literal has item of invalid type!");
    });
  } else if (node instanceof core.Identifier) {
    node.stmtType = (<core.VarDeclaration | core.Parameter>(
      node.declaration
    )).stmtType;
    return node.stmtType;
  } else if (node instanceof core.Type) return node;
  else node.children().forEach((child) => visitTypeAnalyzer(child));
  return new core.BaseType(core.BaseTypeKind.NONE);
}
