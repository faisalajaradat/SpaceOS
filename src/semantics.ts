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
  } else if (
    node instanceof core.FunDeclaration ||
    node instanceof core.AnonymousFunDeclaration
  ) {
    if (node instanceof core.FunDeclaration) {
      const funSymbol = scope.lookupCurrent(node.identifier.value);
      if (funSymbol !== null) {
        errors++;
        console.log(
          "Function name: " +
            node.identifier.value +
            "already defined within scope!",
        );
      } else scope.put(new FunSymbol(node));
    }
    let curScope = scope;
    while (curScope.outer !== null) curScope = curScope.outer;
    curScope = new Scope(curScope);
    node.params.forEach((param) => visitNameAnalyzer(param, curScope));
    visitNameAnalyzer(node._body, curScope);
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
    if (node.stmtType instanceof core.ContainerType) {
      node.stmtType.scope = new Scope(null);
      const curScope = node.stmtType.scope;
      node.stmtType._attributes.forEach((value, fun) => {
        fun.identifier.declaration = fun;
        curScope.put(new FunSymbol(fun));
      });
    }
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
  } else if (node instanceof core.AttributeAccess)
    visitNameAnalyzer(node.containerExpr, scope);
  else node.children().forEach((child) => visitNameAnalyzer(child, scope));
}

let returnFunction: core.FunDeclaration | core.AnonymousFunDeclaration = null;
const voidType = new core.BaseType(core.BaseTypeKind.VOID);
const numberType = new core.BaseType(core.BaseTypeKind.NUMBER);
const boolType = new core.BaseType(core.BaseTypeKind.BOOL);
const stringType = new core.BaseType(core.BaseTypeKind.STRING);

function typesAreEqual(type1: core.Type, type2: core.Type): boolean {
  if (type1 instanceof core.BaseType && type1.kind === core.BaseTypeKind.ANY)
    return true;
  if (type2 instanceof core.BaseType && type2.kind === core.BaseTypeKind.ANY)
    return true;
  if (type1 instanceof core.BaseType && type2 instanceof core.BaseType)
    return type1.kind === type2.kind;
  let type1Base: core.Type = type1;
  let type2Base: core.Type = type2;
  let iter = 0;
  while (
    (type1Base instanceof core.ArrayType &&
      type2Base instanceof core.ArrayType) ||
    (type1Base instanceof core.FunctionType &&
      type2Base instanceof core.FunctionType)
  ) {
    iter++;
    if (
      type1Base instanceof core.ArrayType &&
      type2Base instanceof core.ArrayType
    ) {
      type1Base = type1Base._type;
      type2Base = type2Base._type;
    }
    if (
      type1Base instanceof core.FunctionType &&
      type2Base instanceof core.FunctionType
    ) {
      const incompatibleFunType =
        type1Base.paramTypes.length !== type2Base.paramTypes.length ||
        type1Base.paramTypes.filter(
          (param1Type, pos) =>
            !typesAreEqual(
              param1Type,
              (<core.FunctionType>type2Base).paramTypes[pos],
            ),
        ).length !== 0;
      if (incompatibleFunType) return false;
      type1Base = type1Base.returnType;
      type2Base = type2Base.returnType;
    }
  }
  return iter > 0 && typesAreEqual(type1Base, type2Base);
}

function assignArraySize(type1: core.ArrayType, type2: core.ArrayType) {
  while (
    type1._type instanceof core.ArrayType &&
    type2._type instanceof core.ArrayType
  ) {
    type1._size = type2._size;
    type1 = type1._type;
    type2._type = type2._type;
  }
  type1._size = type2._size;
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
  if (
    node instanceof core.FunDeclaration ||
    node instanceof core.AnonymousFunDeclaration
  ) {
    const oldFunDeclaration = returnFunction;
    returnFunction = node;
    visitTypeAnalyzer(node._body);
    returnFunction = oldFunDeclaration;
    node.params.forEach((param) => visitTypeAnalyzer(param));
    return node.stmtType;
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
      } else {
        if (
          node.stmtType instanceof core.ArrayType &&
          valueType instanceof core.ArrayType
        )
          assignArraySize(node.stmtType, valueType);
        node.value.stmtType = node.stmtType;
      }
    }
  } else if (node instanceof core.Return) {
    if (node.possibleValue === null) {
      if (!typesAreEqual(returnFunction.stmtType, voidType)) {
        errors++;
        console.log("Function is not type void!");
      }
    } else {
      const returnType: core.Type = visitTypeAnalyzer(node.possibleValue);
      if (
        !typesAreEqual(
          returnType,
          (<core.FunctionType>returnFunction.stmtType).returnType,
        )
      ) {
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
          if (
            leftHandType instanceof core.ArrayType &&
            rightHandType instanceof core.ArrayType
          )
            assignArraySize(leftHandType, rightHandType);
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
  } else if (node instanceof core.AttributeAccess) {
    const containerType = visitTypeAnalyzer(node.containerExpr);
    if (!(containerType instanceof core.ContainerType)) {
      errors++;
      console.log("Type does not have attributes!");
      return new core.BaseType(core.BaseTypeKind.NONE);
    }
    const scope = containerType.scope;
    if (!(node.callExpr instanceof core.FunCall)) {
      errors++;
      console.log("Attributes must be called!");
      return new core.BaseType(core.BaseTypeKind.NONE);
    }
    const attributeSymbol = <FunSymbol>(
      scope.lookup(node.callExpr.identifier.value)
    );
    if (attributeSymbol === null) {
      errors++;
      console.log(
        "Attribute " + node.callExpr.identifier.value + " does not exist!",
      );
    } else {
      node.callExpr.identifier.declaration = attributeSymbol.funDeclaration;
      node.stmtType = visitTypeAnalyzer(node.callExpr);
      return node.stmtType;
    }
  } else if (node instanceof core.FunCall) {
    const funType = node.identifier.declaration.stmtType;
    if (!(funType instanceof core.FunctionType)) {
      errors++;
      console.log("Can only perform call on function types");
      return new core.BaseType(core.BaseTypeKind.NONE);
    }
    if (node.args.length !== funType.paramTypes.length) {
      errors++;
      console.log(
        "Funtion " +
          node.identifier.value +
          " called with incorrect number of arguments!",
      );
      return new core.BaseType(core.BaseTypeKind.NONE);
    }
    const argsIncorrectTypingArray = node.args.filter(
      (arg, pos) =>
        !typesAreEqual(visitTypeAnalyzer(arg), funType.paramTypes[pos]),
    );
    if (argsIncorrectTypingArray.length === 0) {
      node.stmtType = funType.returnType;
      return node.stmtType;
    }
    argsIncorrectTypingArray.forEach(() => {
      errors++;
      console.log(
        "Function " +
          node.identifier.value +
          " called with argument not matching paramater type!",
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
    if ((<core.ArrayType>node.stmtType)._size === 0) return node.stmtType;
    node.stmtType = new core.ArrayType(
      visitTypeAnalyzer(node.value[0]),
      (<core.ArrayType>node.stmtType)._size,
    );
    const listOfArraysIncorrectTypes = node.value.filter(
      (exp) =>
        !typesAreEqual(
          (<core.ArrayType>node.stmtType)._type,
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
