import * as core from "./core.js";

export default function analyze(astHead: core.Program): number {
  visitNameAnalyzer(astHead, null);
  visitTypeAnalyzer(astHead);
  return errors;
}
//Defines symbols for symbol table
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

export class UnionSymbol extends ProgramSymbol {
  unionDeclaration: core.UnionDeclaration;

  constructor(unionDeclaration: core.UnionDeclaration) {
    super((<core.UnionType>unionDeclaration.stmtType).identifier.value);
    this.unionDeclaration = unionDeclaration;
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

//Performs name analysis to enforce scope rules
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
    visitNameAnalyzer(node.stmtType, scope);
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
    visitNameAnalyzer(node.stmtType, scope);
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
  } else if (node instanceof core.UnionDeclaration) {
    node.options.forEach((option) => visitNameAnalyzer(option, scope));
    const unionSymbol = scope.lookupCurrent(
      (<core.UnionType>node.stmtType).identifier.value,
    );
    if (unionSymbol !== null) {
      errors++;
      console.log(
        "Union name: " +
          (<core.UnionType>node.stmtType).identifier.value +
          " already defined within scope!",
      );
    } else scope.put(new UnionSymbol(node));
  } else if (node instanceof core.Block) {
    const curScope = new Scope(scope);
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
    node.scope = curScope;
  } else if (node instanceof core.Match) {
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
    else if (programSymbol instanceof UnionSymbol)
      node.declaration = programSymbol.unionDeclaration;
  } else node.children().forEach((child) => visitNameAnalyzer(child, scope));
}

let returnFunction: core.FunDeclaration | core.AnonymousFunDeclaration = null;

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
  const boolType = new core.BaseType(core.BaseTypeKind.BOOL);
  const conditionType = visitTypeAnalyzer(node.condition);
  if (!conditionType.equals(boolType)) {
    errors++;
    console.log("Invalid condition expression type!");
    return false;
  }
  return true;
}

//Performs type analysis to enforce typing rules
function visitTypeAnalyzer(node: core.ASTNode): core.Type {
  const voidType = new core.BaseType(core.BaseTypeKind.VOID);
  const numberType = new core.BaseType(core.BaseTypeKind.NUMBER);
  const boolType = new core.BaseType(core.BaseTypeKind.BOOL);
  const stringType = new core.BaseType(core.BaseTypeKind.STRING);
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
    if (
      !(node.stmtType instanceof core.UnionType) &&
      node.stmtType.equals(voidType)
    ) {
      errors++;
      console.log("Var: " + node.identifier.value + " cannot be type void!");
    } else if (node instanceof core.VarDeclaration) {
      const valueType = visitTypeAnalyzer(node.value);
      if (
        !node.stmtType.equals(valueType) &&
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
      if (!returnFunction.stmtType.equals(voidType)) {
        errors++;
        console.log("Function is not type void!");
      }
    } else {
      const returnType: core.Type = visitTypeAnalyzer(node.possibleValue);
      if (
        !returnType.equals(
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
  } else if (node instanceof core.Match) {
    const subjectType = visitTypeAnalyzer(node.subject);
    const caseTypes = node.caseStmts.map((caseStmt) =>
      visitTypeAnalyzer(caseStmt),
    );
    if (
      caseTypes.filter((caseType) => !caseType.equals(subjectType)).length > 0
    ) {
      errors++;
      console.log("One or more case type(s) do not match the subject!");
    } else if (
      subjectType instanceof core.UnionType &&
      caseTypes.filter(
        (caseType) =>
          (<core.UnionDeclaration>(
            subjectType.identifier.declaration
          )).options.filter((option) => option.equals(caseType)).length > 0,
      ).length <
        (<core.UnionDeclaration>subjectType.identifier.declaration).options
          .length
    ) {
      errors++;
      console.log("Need to cover each possible type the subject could be!");
    }
  } else if (node instanceof core.CaseStmt) {
    visitTypeAnalyzer(node.stmt);
    node.stmtType = visitTypeAnalyzer(node.matchCondition);
    return node.stmtType;
  } else if (node instanceof core.BinaryExpr) {
    const leftHandType = visitTypeAnalyzer(node.leftExpr);
    const rightHandType = visitTypeAnalyzer(node.rightExpr);
    switch (node.operator) {
      case "+":
        if (
          (leftHandType.equals(numberType) &&
            rightHandType.equals(numberType)) ||
          (leftHandType.equals(stringType) && rightHandType.equals(stringType))
        ) {
          node.stmtType = leftHandType.equals(numberType)
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
          leftHandType.equals(numberType) &&
          rightHandType.equals(numberType)
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
          "Can only use the " + node.operator + " operator on numbers!",
        );
        break;
      case "==":
      case "!=":
        node.stmtType = new core.BaseType(core.BaseTypeKind.BOOL);
        return node.stmtType;
        break;
      case "||":
      case "&&":
        if (leftHandType.equals(boolType) && rightHandType.equals(boolType)) {
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
          !leftHandType.equals(rightHandType) &&
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
      !expType.equals(numberType)
    ) {
      errors++;
      console.log("Can only use the " + node.operator + " on numbers!");
    } else if (node.operator === "!" && !expType.equals(boolType)) {
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
    if (!indexType.equals(numberType)) {
      errors++;
      console.log("Index must be type number!");
    } else {
      const arrayElementType = visitTypeAnalyzer(node.arrayExpr);
      if (arrayElementType instanceof core.ArrayType) {
        node.stmtType = arrayElementType._type;
        return node.stmtType;
      }
      errors++;
      console.log("Cannot access type that is not an array!");
    }
  } else if (node instanceof core.FunCall) {
    const funType = visitTypeAnalyzer(node.identifier);
    if (!(funType instanceof core.FunctionType)) {
      errors++;
      console.log("Can only perform call on function types");
      return new core.BaseType(core.BaseTypeKind.NONE);
    }
    if (node.args.length !== funType.paramTypes.length) {
      errors++;
      console.log(
        "Funtion " +
          node.identifier +
          " called with incorrect number of arguments!",
      );
      return new core.BaseType(core.BaseTypeKind.NONE);
    }
    const argsIncorrectTypingArray = node.args.filter(
      (arg, pos) => !visitTypeAnalyzer(arg).equals(funType.paramTypes[pos]),
    );
    if (argsIncorrectTypingArray.length === 0) {
      node.stmtType = funType.returnType;
      return node.stmtType;
    }
    argsIncorrectTypingArray.forEach(() => {
      errors++;
      console.log(
        "Function " +
          node.identifier +
          " called with argument not matching paramater type!",
      );
    });
  } else if (
    node instanceof core.StringLiteral ||
    node instanceof core.BoolLiteral ||
    node instanceof core.NumberLiteral ||
    node instanceof core.NoneLiteral
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
        !(<core.ArrayType>node.stmtType)._type.equals(visitTypeAnalyzer(exp)),
    );
    if (listOfArraysIncorrectTypes.length === 0) return node.stmtType;
    listOfArraysIncorrectTypes.forEach(() => {
      errors++;
      console.log("Array literal has item of invalid type!");
    });
  } else if (node instanceof core.Identifier) {
    node.stmtType = node.declaration.stmtType;
    return node.stmtType;
  } else if (node instanceof core.Type) return node;
  else node.children().forEach((child) => visitTypeAnalyzer(child));
  return new core.BaseType(core.BaseTypeKind.NONE);
}
