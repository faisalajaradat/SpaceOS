import * as core from "./core/program.js";
import {isDecorator} from "./utils.js";
import {
  Block,
  CaseStmt,
  DeferredDecorator, If,
  libFunctions,
  Match,
  Parameter,
  Return,
  UnionDeclaration,
  VarDeclaration,
  While
} from "./core/stmts.js";
import {
  ArrayAccess,
  ArrayLiteral, BinaryExpr,
  BoolLiteral, Exprs, FunCall, FunDeclaration,
  Identifier,
  NoneLiteral,
  NumberLiteral,
  SpacialObjectInstantiationExpr,
  StringLiteral, TypeCast, UnaryExpr
} from "./core/exprs.js";
import {SymbolDeclaration} from "./core/program.js";
import {ArrayType, BaseType, BaseTypeKind, CompositionType, FunctionType, Type} from "./core/type/primitive-types.js";
import {
  AirPathType,
  AnimateEntityType, ControlDecorator,
  EnclosedSpaceType, LandPathType,
  MotionDecorator, OpenSpaceType, PathType,
  SmartEntityType, SpatialType,
  StaticEntityType
} from "./core/type/spatial-types.js";
import {UnionType} from "./core/type/union-type.js";

export default function analyze(astHead: core.Program): number {
  visitNameAnalyzer(astHead, null);
  visitTypeAnalyzer(astHead);
  return errors;
}
//Defines symbols for symbol table
export abstract class ProgramSymbol {
  name: string;

  protected constructor(name: string) {
    this.name = name;
  }
}

export class VarSymbol extends ProgramSymbol {
  varDeclaration: SymbolDeclaration;

  constructor(varDeclaration: SymbolDeclaration) {
    super(varDeclaration.identifier.value);
    this.varDeclaration = varDeclaration;
  }
}

export class UnionSymbol extends ProgramSymbol {
  unionDeclaration: UnionDeclaration;

  constructor(unionDeclaration: UnionDeclaration) {
    super((<UnionType>unionDeclaration._type).identifier.value);
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
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
    node.scope = curScope;
  } else if (node instanceof FunDeclaration) {
    visitNameAnalyzer(node._type, scope);
    let curScope = scope;
    while (curScope.outer !== null) curScope = curScope.outer;
    curScope = new Scope(curScope);
    node.params.forEach((param) => visitNameAnalyzer(param, curScope));
    visitNameAnalyzer(node._body, curScope);
    node.scope = curScope;
  } else if (
    node instanceof VarDeclaration ||
    node instanceof Parameter
  ) {
    visitNameAnalyzer(node._type, scope);
    const paramSymbol = scope.lookupCurrent(node.identifier.value);
    if (paramSymbol !== null) {
      errors++;
      console.log(
        node.getFilePos() +
          "Variable name: " +
          node.identifier.value +
          " already defined within scope!",
      );
    } else scope.put(new VarSymbol(node));
    if (node instanceof VarDeclaration)
      visitNameAnalyzer(node.value, scope);
  } else if (node instanceof UnionDeclaration) {
    node.options.forEach((option) => visitNameAnalyzer(option, scope));
    const unionSymbol = scope.lookupCurrent(
      (<UnionType>node._type).identifier.value,
    );
    if (unionSymbol !== null) {
      errors++;
      console.log(
        node.getFilePos() +
          "Union name: " +
          (<UnionType>node._type).identifier.value +
          " already defined within scope!",
      );
    } else scope.put(new UnionSymbol(node));
  } else if (node instanceof Block) {
    const curScope = new Scope(scope);
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
    node.scope = curScope;
  } else if (node instanceof CaseStmt) {
    const curScope = new Scope(scope);
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
    node.scope = curScope;
  } else if (node instanceof DeferredDecorator) {
    node.scopeArgs.forEach((arg) => visitNameAnalyzer(arg, scope));
    node.scopeParams = node.scopeArgs.map(
      (arg) =>
        new Parameter(arg.line, arg.column, arg.declaration._type, arg),
    );
    const newScope = new Scope(null);
    libFunctions.forEach((_value, key) => visitNameAnalyzer(key, newScope));
    node.scopeParams.forEach((param) => visitNameAnalyzer(param, newScope));
    visitNameAnalyzer(node.delegate, newScope);
    node.scope = newScope;
  } else if (node instanceof Identifier) {
    const programSymbol = scope.lookup(node.value);
    if (programSymbol === null) {
      errors++;
      console.log(
        node.getFilePos() + "Symbol: " + node.value + " has not been declared!",
      );
      return;
    } else if (programSymbol instanceof VarSymbol)
      node.declaration = programSymbol.varDeclaration;
    else if (programSymbol instanceof UnionSymbol)
      node.declaration = programSymbol.unionDeclaration;
  } else {
    node.children().forEach((child) => visitNameAnalyzer(child, scope));
  }
}

let returnFunction: FunDeclaration = undefined;

function assignArraySize(type1: ArrayType, type2: ArrayType) {
  while (
    type1._type instanceof ArrayType &&
    type2._type instanceof ArrayType
  ) {
    type1._size = type2._size;
    type1 = type1._type;
    type2 = type2._type;
  }
  type1._size = type2._size;
}

function conditionIsValidType(node: If | While): boolean {
  const boolType = new BaseType(-1, -1, BaseTypeKind.BOOL);
  const conditionType = visitTypeAnalyzer(node.condition);
  if (!conditionType.equals(boolType)) {
    errors++;
    console.log("Invalid condition expression type!");
    return false;
  }
  return true;
}

//Performs type analysis to enforce typing rules
function visitTypeAnalyzer(node: core.ASTNode): Type {
  const voidType = new BaseType(-1, -1, BaseTypeKind.VOID);
  const numberType = new BaseType(-1, -1, BaseTypeKind.NUMBER);
  const boolType = new BaseType(-1, -1, BaseTypeKind.BOOL);
  const stringType = new BaseType(-1, -1, BaseTypeKind.STRING);
  if (node instanceof FunDeclaration) {
    const oldFunDeclaration = returnFunction;
    returnFunction = node;
    visitTypeAnalyzer(node._body);
    returnFunction = oldFunDeclaration;
    node.params.forEach((param) => visitTypeAnalyzer(param));
    return node._type;
  } else if (
    node instanceof VarDeclaration ||
    node instanceof Parameter
  ) {
    if (
      !(node._type instanceof UnionType) &&
      !(
        node._type instanceof BaseType &&
        node._type.kind === BaseTypeKind.ANY
      ) &&
      node._type.equals(voidType)
    ) {
      errors++;
      console.log(
        node.getFilePos() +
          "Var: " +
          node.identifier.value +
          " cannot be type void!",
      );
    } else if (node instanceof VarDeclaration) {
      const valueType = visitTypeAnalyzer(node.value);
      if (
        !node._type.equals(valueType) &&
        !(
          node.value instanceof ArrayLiteral &&
          valueType instanceof BaseType &&
          valueType.kind === BaseTypeKind.NONE
        )
      ) {
        errors++;
        console.log(
          node.getFilePos() + "Both sides of assignment must be the same type!",
        );
      } else {
        if (
          node._type instanceof ArrayType &&
          valueType instanceof ArrayType
        )
          assignArraySize(node._type, valueType);
        node.value._type = node._type;
      }
    } else return node._type;
  } else if (node instanceof Return) {
    if (node.possibleValue === null) {
      if (
        returnFunction !== undefined &&
        !returnFunction._type.equals(voidType)
      ) {
        errors++;
        console.log(node.getFilePos() + "Function is not type void!");
      }
    } else {
      const returnType: Type = visitTypeAnalyzer(node.possibleValue);
      if (
        returnFunction === undefined ||
        !returnType.equals(
          (<FunctionType>returnFunction._type).returnType,
        )
      ) {
        errors++;
        console.log(node.getFilePos() + "Incorrect return type");
      }
    }
  } else if (node instanceof DeferredDecorator) {
    const oldFunDeclaration = returnFunction;
    returnFunction = undefined;
    node.children().forEach((child) => visitTypeAnalyzer(child));
    returnFunction = oldFunDeclaration;
  } else if (node instanceof If) {
    if (conditionIsValidType(node)) {
      visitTypeAnalyzer(node.ifStmt);
      if (node.possibleElseStmt !== null)
        visitTypeAnalyzer(node.possibleElseStmt);
    }
  } else if (node instanceof While) {
    if (conditionIsValidType(node)) visitTypeAnalyzer(node.whileStmt);
  } else if (node instanceof Match) {
    const subjectType = visitTypeAnalyzer(node.subject);
    const caseTypes = node.caseStmts.map((caseStmt) =>
      visitTypeAnalyzer(caseStmt),
    );
    const incorrectCaseTypes = caseTypes.filter(
      subjectType instanceof CompositionType
        ? (caseType) => !subjectType.contains(caseType)
        : (caseType) => !caseType.equals(subjectType),
    );
    incorrectCaseTypes.forEach((caseType) => {
      errors++;
      console.log(
        caseType.getFilePos() + "Case type incompatible with subject!",
      );
    });
    if (incorrectCaseTypes.length > 0)
      return new BaseType(-1, -1, BaseTypeKind.NONE);
    if (
      subjectType instanceof UnionType &&
      caseTypes.filter(
        (caseType) =>
          (<UnionDeclaration>(
            subjectType.identifier.declaration
          )).options.filter((option) => option.equals(caseType)).length > 0,
      ).length <
        (<UnionDeclaration>subjectType.identifier.declaration).options
          .length
    ) {
      errors++;
      console.log(
        node.getFilePos() +
          "Need to cover each possible type the subject could be!",
      );
    }
  } else if (node instanceof CaseStmt) {
    visitTypeAnalyzer(node.stmt);
    node.matchCondition._type =
      node.matchCondition instanceof Exprs
        ? visitTypeAnalyzer(node.matchCondition)
        : node.matchCondition._type;
    node._type = node.matchCondition._type;
    return node._type;
  } else if (node instanceof BinaryExpr) {
    const leftHandType = visitTypeAnalyzer(node.leftExpr);
    const rightHandType = visitTypeAnalyzer(node.rightExpr);
    switch (node.operator) {
      case "+":
        if (
          (leftHandType.equals(numberType) &&
            rightHandType.equals(numberType)) ||
          (leftHandType.equals(stringType) && rightHandType.equals(stringType))
        ) {
          node._type = leftHandType.equals(numberType)
            ? new BaseType(
                leftHandType.line,
                leftHandType.column,
                BaseTypeKind.NUMBER,
              )
            : new BaseType(
                leftHandType.line,
                leftHandType.column,
                BaseTypeKind.STRING,
              );
          return node._type;
        }
        errors++;
        console.log(
          node.getFilePos() +
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
          node._type = operatorCreatesBool
            ? new BaseType(node.line, node.column, BaseTypeKind.BOOL)
            : new BaseType(
                node.line,
                node.column,
                BaseTypeKind.NUMBER,
              );
          return node._type;
        }
        errors++;
        console.log(
          node.getFilePos() +
            "Can only use the " +
            node.operator +
            " operator on numbers!",
        );
        break;
      case "==":
      case "!=":
        node._type = new BaseType(
          node.line,
          node.column,
          BaseTypeKind.BOOL,
        );
        return node._type;
      case "||":
      case "&&":
        if (leftHandType.equals(boolType) && rightHandType.equals(boolType)) {
          node._type = new BaseType(
            node.line,
            node.column,
            BaseTypeKind.BOOL,
          );
          return node._type;
        }
        errors++;
        console.log(
          node.getFilePos() +
            "The " +
            node.operator +
            " operator can only be used with type bool!",
        );
        break;
      case "=":
        if (
          !(node.leftExpr instanceof Identifier) &&
          !(node.leftExpr instanceof ArrayAccess)
        ) {
          errors++;
          console.log(
            node.getFilePos() +
              "Left-hand side of assignment must be an lvalue!",
          );
          break;
        } else if (
          !leftHandType.equals(rightHandType) &&
          !(
            node.rightExpr instanceof ArrayLiteral &&
            rightHandType instanceof BaseType &&
            rightHandType.kind === BaseTypeKind.NONE
          )
        ) {
          errors++;
          console.log(
            node.getFilePos() + "Both sides of assigment must be same type!",
          );
          break;
        } else if (leftHandType instanceof FunctionType) {
          errors++;
          console.log(
            node.getFilePos() + "Function declarations are immutable!",
          );
          break;
        } else {
          if (
            leftHandType instanceof ArrayType &&
            rightHandType instanceof ArrayType
          )
            assignArraySize(leftHandType, rightHandType);
          node._type = leftHandType;
          node.rightExpr._type = node._type;
          return node._type;
        }
    }
  } else if (node instanceof UnaryExpr) {
    const expType = visitTypeAnalyzer(node.expr);
    if (
      (node.operator === "+" || node.operator === "-") &&
      !expType.equals(numberType)
    ) {
      errors++;
      console.log(
        node.getFilePos() +
          "Can only use the " +
          node.operator +
          " on numbers!",
      );
    } else if (node.operator === "!" && !expType.equals(boolType)) {
      errors++;
      console.log(
        node.getFilePos() + "Can only use the " + node.operator + " on bools!",
      );
    } else {
      node._type =
        node.operator === "!"
          ? new BaseType(node.line, node.column, BaseTypeKind.BOOL)
          : new BaseType(node.line, node.column, BaseTypeKind.NUMBER);
      return node._type;
    }
  } else if (node instanceof ArrayAccess) {
    const indexType = visitTypeAnalyzer(node.accessExpr);
    if (!indexType.equals(numberType)) {
      errors++;
      console.log(node.accessExpr.getFilePos() + "Index must be type number!");
    } else {
      const arrayElementType = visitTypeAnalyzer(node.arrayExpr);
      if (arrayElementType instanceof ArrayType) {
        node._type = arrayElementType._type;
        return node._type;
      }
      errors++;
      console.log(
        node.getFilePos() + "Cannot access type that is not an array!",
      );
    }
  } else if (node instanceof TypeCast) {
    const desiredType = visitTypeAnalyzer(node._type);
    if (desiredType instanceof CompositionType) {
      const castedExpressionType = visitTypeAnalyzer(node.castedExpr);
      if (desiredType.contains(castedExpressionType)) {
        node._type = desiredType;
        return node._type;
      } else {
        errors++;
        console.log(
          node.getFilePos() +
            "Cannot cast an expression to a composition type that does not contain the original type!",
        );
      }
    } else {
      errors++;
      console.log(
        node.getFilePos() +
          "Cannot cast an expression to any type other than a composition type containing the original type!",
      );
    }
  } else if (node instanceof FunCall) {
    const funType = visitTypeAnalyzer(node.identifier);
    if (!(funType instanceof FunctionType)) {
      errors++;
      console.log(
        node.getFilePos() + "Can only perform call on function types",
      );
      return new BaseType(-1, -1, BaseTypeKind.NONE);
    }
    if (node.args.length !== funType.paramTypes.length) {
      errors++;
      console.log(
        node.getFilePos() +
          "Function " +
          node.identifier +
          " called with incorrect number of arguments!",
      );
      return new BaseType(-1, -1, BaseTypeKind.NONE);
    }
    const argsIncorrectTypingArray = node.args.filter(
      (arg, pos) => !visitTypeAnalyzer(arg).equals(funType.paramTypes[pos]),
    );
    if (
      node.identifier instanceof Identifier &&
      node.identifier.value === "push"
    )
      if (
        !visitTypeAnalyzer(node.args[1]).equals(
          (<ArrayType>visitTypeAnalyzer(node.args[0]))._type,
        )
      )
        argsIncorrectTypingArray.push(node.args[1]);
    if (argsIncorrectTypingArray.length === 0) {
      node._type = funType.returnType;
      return node._type;
    }
    argsIncorrectTypingArray.forEach((arg) => {
      errors++;
      console.log(
        arg.getFilePos() +
          "Function " +
          node.identifier +
          " called with argument not matching parameter type!",
      );
    });
  } else if (node instanceof SpacialObjectInstantiationExpr) {
    if (isDecorator(node._type)) {
      if (
        node._type.delegate instanceof PathType ||
        (node._type.delegate instanceof ControlDecorator &&
          ((<ControlDecorator>node._type.delegate).delegate instanceof
            SpatialType ||
            node._type.delegate.delegate instanceof StaticEntityType ||
            node._type.delegate.delegate instanceof MotionDecorator))
      ) {
        let delegateType = node._type.delegate;
        while (isDecorator(delegateType)) delegateType = delegateType.delegate;
        if (
          !(
            <SpatialType>delegateType instanceof PathType ||
            delegateType instanceof AirPathType ||
            delegateType instanceof LandPathType ||
            delegateType instanceof OpenSpaceType ||
            delegateType instanceof EnclosedSpaceType ||
            delegateType instanceof StaticEntityType ||
            delegateType instanceof SmartEntityType ||
            delegateType instanceof AnimateEntityType
          )
        ) {
          errors++;
          console.log(node.getFilePos() + "Cannot instantiate abstract type!");
        } else return node._type;
      }
    }
    errors++;
    console.log(
      node.getFilePos() +
        "May only instantiate a fully described spatial type!",
    );
  } else if (
    node instanceof StringLiteral ||
    node instanceof BoolLiteral ||
    node instanceof NumberLiteral ||
    node instanceof NoneLiteral
  )
    return node._type;
  else if (node instanceof ArrayLiteral) {
    if ((<ArrayType>node._type)._size === 0) return node._type;
    node._type = new ArrayType(
      node._type.line,
      node._type.column,
      visitTypeAnalyzer(node.value[0]),
      (<ArrayType>node._type)._size,
    );
    const listOfArraysIncorrectTypes = node.value.filter(
      (exp) =>
        !(<ArrayType>node._type)._type.equals(visitTypeAnalyzer(exp)),
    );
    if (listOfArraysIncorrectTypes.length === 0) return node._type;
    listOfArraysIncorrectTypes.forEach((exp) => {
      errors++;
      console.log(exp.getFilePos() + "Array literal has item of invalid type!");
    });
  } else if (node instanceof Identifier) {
    node._type = node.declaration._type;
    return node._type;
  } else if (node instanceof Type) return node;
  else node.children().forEach((child) => visitTypeAnalyzer(child));
  return new BaseType(-1, -1, BaseTypeKind.NONE);
}
