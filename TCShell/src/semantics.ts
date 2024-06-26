import {
  Assignment,
  ASTNode,
  ControlFlowStmt,
  ExprStmt,
  Program,
  SymbolDeclaration,
} from "./core/program.js";
import { isDecorator } from "./utils.js";
import {
  Block,
  CaseStmt,
  DeferredDecorator,
  If,
  libFunctions,
  Match,
  Parameter,
  Return,
  Stmt,
  UnionDeclaration,
  VarDeclaration,
  While,
} from "./core/stmts.js";
import { Expr } from "./core/expr/Expr.js";
import {
  AnimateEntityType,
  ArrayAccess,
  ArrayLiteral,
  ArrayType,
  BaseType,
  BaseTypeKind,
  BinaryExpr,
  CompositionType,
  ControlDecorator,
  DefaultBaseTypeInstance,
  EnclosedSpaceType,
  FunctionType,
  FunDeclaration,
  Identifier,
  MotionDecorator,
  OpenSpaceType,
  PathType,
  SmartEntityType,
  SpaceType,
  SpatialObjectInstantiationExpr,
  StaticEntityType,
  Type,
  UnaryExpr,
  UnionType,
} from "./core/index.js";
import { TypeCast } from "./core/expr/TypeCast.js";
import { FunCall } from "./core/expr/FunCall.js";

export default function analyze(astHead: Program): number {
  visitNameAnalyzer(astHead, null);
  checkType(astHead);
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
function visitNameAnalyzer(node: ASTNode, scope: Scope) {
  if (node instanceof Program) {
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
  } else if (node instanceof VarDeclaration || node instanceof Parameter) {
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
    if (node instanceof VarDeclaration) visitNameAnalyzer(node.value, scope);
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
      (arg) => new Parameter(arg.line, arg.column, arg.declaration._type, arg),
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
  while (type1._type instanceof ArrayType && type2._type instanceof ArrayType) {
    type1._size = type2._size;
    type1 = type1._type;
    type2 = type2._type;
  }
  type1._size = type2._size;
}

export const enum TypeRule {
  ControlFlowConditionIsBool,
  AssignedToSameType,
  ReturnsFunctionType,
  AllCaseTypeAreCompatible,
  CompleteMatchUnionTypeCoverage,
  AssignedToLValue,
  AssignedToOnlyMutableValue,
  TypeCastToContainingType,
  OnlyNumbersAndStringForPlusOperation,
  OnlyNumbersUsedForMathOperation,
  OnlyPrimitiveTypeForEqualityOperation,
  OnlyBoolsUsedForBooleanOperation,
  ArrayAccessIndexIsNumber,
  OnlyArrayTypesAreAccessed,
  FunctionCalledOnFunctionType,
  FunctionCalledWithMatchingNumberOfArgs,
  AllArgsInFunctionCallMatchParameter,
  NonAbstractSpatialObjectInstantiated,
  FullyDescribedSpatialObjectInstantiated,
  ArrayLiteralDeclaredWithEntriesAllMatchingType,
}

const typeRuleApplicationDictionary: {
  [key in TypeRule]: (node: ExprStmt) => boolean;
} = {
  [TypeRule.ControlFlowConditionIsBool]: (
    controlFlowStmt: ControlFlowStmt,
  ): boolean => {
    return checkType(controlFlowStmt.condition).equals(
      DefaultBaseTypeInstance.BOOL,
    );
  },

  [TypeRule.AssignedToSameType]: (assignment: Assignment): boolean => {
    const leftHandType =
      assignment instanceof VarDeclaration
        ? assignment._type
        : checkType(assignment.leftExpr);
    const rightHandType =
      assignment instanceof VarDeclaration
        ? checkType(assignment.value)
        : checkType(assignment.rightExpr);
    const isSameType = leftHandType.equals(rightHandType);
    if (leftHandType instanceof ArrayType && rightHandType instanceof ArrayType)
      assignArraySize(leftHandType, rightHandType);
    assignment._type = isSameType
      ? leftHandType
      : new BaseType(assignment.line, assignment.column, BaseTypeKind.NONE);
    return isSameType;
  },

  [TypeRule.ReturnsFunctionType]: (returnStmt: Return): boolean => {
    if (returnStmt.possibleValue === null)
      return (
        returnFunction === undefined ||
        (returnFunction._type as FunctionType).returnType.equals(
          DefaultBaseTypeInstance.VOID,
        )
      );
    return (
      returnFunction !== undefined &&
      checkType(returnStmt.possibleValue).equals(
        (returnFunction._type as FunctionType).returnType,
      )
    );
  },

  [TypeRule.AllCaseTypeAreCompatible]: (matchStmt: Match): boolean => {
    const subjectType = checkType(matchStmt.subject);
    return (
      matchStmt.caseStmts.filter((caseStmt) => {
        const caseType = checkType(caseStmt.matchCondition);
        caseStmt._type = caseType;
        return subjectType instanceof CompositionType
          ? !subjectType.contains(caseType)
          : !subjectType.equals(caseType);
      }).length === 0
    );
  },

  [TypeRule.CompleteMatchUnionTypeCoverage]: (matchStmt: Match): boolean => {
    const subjectType = checkType(matchStmt.subject);
    return !(
      subjectType instanceof UnionType &&
      matchStmt.caseStmts.filter(
        (caseStmt) =>
          (
            subjectType.identifier.declaration as UnionDeclaration
          ).options.filter((typeOption) => typeOption.equals(caseStmt._type))
            .length > 0,
      ).length <
        (subjectType.identifier.declaration as UnionDeclaration).options.length
    );
  },

  [TypeRule.AssignedToLValue]: (assignment: Assignment): boolean =>
    assignment instanceof VarDeclaration ||
    assignment.leftExpr instanceof Identifier ||
    assignment.leftExpr instanceof ArrayAccess,

  [TypeRule.AssignedToOnlyMutableValue]: (assignment: Assignment): boolean =>
    assignment instanceof VarDeclaration ||
    !(checkType(assignment.leftExpr) instanceof FunctionType),

  [TypeRule.TypeCastToContainingType]: (typeCast: TypeCast): boolean =>
    typeCast._type instanceof CompositionType &&
    typeCast._type.contains(checkType(typeCast.castedExpr)),

  [TypeRule.OnlyNumbersAndStringForPlusOperation]: (additionExpr: BinaryExpr): boolean => {
    const leftHandType: Type = checkType(additionExpr.leftExpr);
    const rightHandType: Type = checkType(additionExpr.rightExpr);
    const eitherSideIsString =
      leftHandType.equals(DefaultBaseTypeInstance.STRING) ||
      rightHandType.equals(DefaultBaseTypeInstance.STRING);
    const bothAreValid =
      (leftHandType.equals(DefaultBaseTypeInstance.NUMBER) ||
        leftHandType.equals(DefaultBaseTypeInstance.STRING)) &&
      (rightHandType.equals(DefaultBaseTypeInstance.STRING) ||
        rightHandType.equals(DefaultBaseTypeInstance.NUMBER));

    additionExpr._type = new BaseType(
      additionExpr.line,
      additionExpr.column,
      !bothAreValid
        ? BaseTypeKind.NONE
        : eitherSideIsString
          ? BaseTypeKind.STRING
          : BaseTypeKind.NUMBER,
    );
    return bothAreValid;
  },

  [TypeRule.OnlyNumbersUsedForMathOperation]: (
    mathExpr: BinaryExpr | UnaryExpr,
  ): boolean => {
    const bothSidesAreNumbers =
      mathExpr instanceof UnaryExpr
        ? checkType(mathExpr.expr).equals(DefaultBaseTypeInstance.NUMBER)
        : checkType(mathExpr.leftExpr).equals(DefaultBaseTypeInstance.NUMBER) &&
          checkType(mathExpr.rightExpr).equals(DefaultBaseTypeInstance.NUMBER);
    const operatorCreatesBool =
      mathExpr.operator === ">" ||
      mathExpr.operator === ">=" ||
      mathExpr.operator === "<" ||
      mathExpr.operator === "<=";

    mathExpr._type = new BaseType(
      mathExpr.line,
      mathExpr.column,
      !bothSidesAreNumbers
        ? BaseTypeKind.NONE
        : operatorCreatesBool
          ? BaseTypeKind.BOOL
          : BaseTypeKind.NUMBER,
    );
    return bothSidesAreNumbers;
  },

  [TypeRule.OnlyPrimitiveTypeForEqualityOperation]: (
    equalityExpr: BinaryExpr,
  ): boolean => {
    const leftHandType = checkType(equalityExpr.leftExpr);
    const bothSidesAreTheSamePrimitiveType =
      leftHandType instanceof BaseType &&
      leftHandType.equals(checkType(equalityExpr.rightExpr));
    equalityExpr._type = new BaseType(
      equalityExpr.line,
      equalityExpr.column,
      bothSidesAreTheSamePrimitiveType ? BaseTypeKind.BOOL : BaseTypeKind.NONE,
    );
    return bothSidesAreTheSamePrimitiveType;
  },

  [TypeRule.OnlyBoolsUsedForBooleanOperation]: (
    booleanExpr: BinaryExpr | UnaryExpr,
  ): boolean => {
    const bothSidesAreBools =
      booleanExpr instanceof UnaryExpr
        ? checkType(booleanExpr.expr).equals(DefaultBaseTypeInstance.BOOL)
        : checkType(booleanExpr.leftExpr).equals(
            DefaultBaseTypeInstance.BOOL,
          ) &&
          checkType(booleanExpr.rightExpr).equals(DefaultBaseTypeInstance.BOOL);
    booleanExpr._type = new BaseType(
      booleanExpr.line,
      booleanExpr.column,
      bothSidesAreBools ? BaseTypeKind.BOOL : BaseTypeKind.NONE,
    );
    return bothSidesAreBools;
  },

  [TypeRule.ArrayAccessIndexIsNumber]: (arrayAccess: ArrayAccess): boolean =>
    checkType(arrayAccess.accessExpr).equals(DefaultBaseTypeInstance.NUMBER),

  [TypeRule.OnlyArrayTypesAreAccessed]: (arrayAccess: ArrayAccess): boolean => {
    const arrayType = checkType(arrayAccess.arrayExpr);
    const isArrayType = arrayType instanceof ArrayType;
    arrayAccess._type = isArrayType
      ? arrayType._type
      : new BaseType(arrayAccess.line, arrayAccess.column, BaseTypeKind.NONE);
    return isArrayType;
  },

  [TypeRule.FunctionCalledOnFunctionType]: (funCall: FunCall): boolean => {
    const calledSubjectType = checkType(funCall.identifier);
    funCall.identifier._type = calledSubjectType;
    const isFunctionType = calledSubjectType instanceof FunctionType;
    funCall._type = isFunctionType
      ? calledSubjectType.returnType
      : new BaseType(funCall.line, funCall.column, BaseTypeKind.NONE);
    return isFunctionType;
  },

  [TypeRule.FunctionCalledWithMatchingNumberOfArgs]: (
    funCall: FunCall,
  ): boolean =>
    funCall.args.length ===
    (funCall.identifier._type as FunctionType).paramTypes.length,

  [TypeRule.AllArgsInFunctionCallMatchParameter]: (
    funCall: FunCall,
  ): boolean => {
    if (
      !(funCall.identifier instanceof Identifier) ||
      funCall.identifier.value !== "push"
    )
      return (
        funCall.args.filter(
          (arg, pos) =>
            !checkType(arg).equals(
              (funCall.identifier._type as FunctionType).paramTypes[pos],
            ),
        ).length === 0
      );
    const arg0Type = checkType(funCall.args[0]);
    return (
      arg0Type instanceof ArrayType &&
      checkType(funCall.args[1]).equals(arg0Type._type)
    );
  },

  [TypeRule.NonAbstractSpatialObjectInstantiated]: (
    objectInstantiation: SpatialObjectInstantiationExpr,
  ): boolean => {
    let baseObjectType = objectInstantiation._type;
    while (isDecorator(baseObjectType))
      baseObjectType = baseObjectType.delegate;
    return (
      baseObjectType instanceof PathType ||
      baseObjectType instanceof EnclosedSpaceType ||
      baseObjectType instanceof OpenSpaceType ||
      baseObjectType instanceof StaticEntityType ||
      baseObjectType instanceof AnimateEntityType ||
      baseObjectType instanceof SmartEntityType
    );
  },

  [TypeRule.FullyDescribedSpatialObjectInstantiated]: (
    objectInstantiation: SpatialObjectInstantiationExpr,
  ): boolean =>
    isDecorator(objectInstantiation._type) &&
    (objectInstantiation._type.delegate instanceof PathType ||
      (objectInstantiation._type.delegate instanceof ControlDecorator &&
        (objectInstantiation._type.delegate.delegate instanceof SpaceType ||
          objectInstantiation._type.delegate.delegate instanceof
            StaticEntityType ||
          objectInstantiation._type.delegate.delegate instanceof
            MotionDecorator))),

  [TypeRule.ArrayLiteralDeclaredWithEntriesAllMatchingType]: (
    arrayLiteral: ArrayLiteral,
  ): boolean => {
    arrayLiteral._type = new ArrayType(
      arrayLiteral.line,
      arrayLiteral.column,
      checkType(arrayLiteral.value[0]),
      arrayLiteral.value.length,
    );
    return (
      arrayLiteral.value.filter(
        (expr) =>
          !(arrayLiteral._type as ArrayType)._type.equals(checkType(expr)),
      ).length === 0
    );
  },
};

const typeRuleFailureMessageDictionary: {
  [key in TypeRule]: (node: ExprStmt) => string;
} = {
  [TypeRule.ControlFlowConditionIsBool]: (
    controlFlowStmt: ControlFlowStmt,
  ): string =>
    controlFlowStmt.getFilePos() +
    "The condition of a control flow statment must be of type bool!",

  [TypeRule.AssignedToSameType]: (assignment: Assignment): string =>
    assignment.getFilePos() +
    "Both sides of an assignment must be the same type!",

  [TypeRule.ReturnsFunctionType]: (returnStmt: Return): string =>
    returnStmt.getFilePos() + "Incorrect return type!",

  [TypeRule.AllCaseTypeAreCompatible]: (matchStmt: Match): string =>
    matchStmt.getFilePos() + "Case type incompatible with subject!",

  [TypeRule.CompleteMatchUnionTypeCoverage]: (matchStmt: Match): string =>
    matchStmt.getFilePos() +
    "Need to cover each possible type the subject could be!",

  [TypeRule.AssignedToLValue]: (assignment: Assignment): string =>
    assignment.getFilePos() + "The left side of assignment must be an lvalue!",

  [TypeRule.AssignedToOnlyMutableValue]: (assignment: Assignment): string =>
    assignment.getFilePos() +
    "The left side of assignment must be a mutable type!",

  [TypeRule.TypeCastToContainingType]: (typeCast: TypeCast): string =>
    typeCast.getFilePos() +
    "Cannot cast an expression to any type other than a composition type containing the original type!",

  [TypeRule.OnlyNumbersAndStringForPlusOperation]: (additionExpr: BinaryExpr): string =>
    additionExpr.getFilePos() +
    "Can only use the + operator on numbers and strings!",

  [TypeRule.OnlyNumbersUsedForMathOperation]: (mathExpr: BinaryExpr): string =>
    mathExpr.getFilePos() +
    "Can only use the " +
    mathExpr.operator +
    " math operator on numbers!",

  [TypeRule.OnlyPrimitiveTypeForEqualityOperation]: (
    equalityExpr: BinaryExpr,
  ): string =>
    equalityExpr.getFilePos() +
    "Can only use the " +
    equalityExpr.operator +
    " on two of the same primitive types!",

  [TypeRule.OnlyBoolsUsedForBooleanOperation]: (
    booleanExpr: BinaryExpr,
  ): string =>
    booleanExpr.getFilePos() +
    "Can only use the " +
    booleanExpr.operator +
    " operator on bools!",

  [TypeRule.ArrayAccessIndexIsNumber]: (arrayAccess: ArrayAccess): string =>
    arrayAccess.getFilePos() + "Index must be type number!",

  [TypeRule.OnlyArrayTypesAreAccessed]: (arrayAccess: ArrayAccess): string =>
    arrayAccess.getFilePos() + "Cannot access type that is not an array!",

  [TypeRule.FunctionCalledOnFunctionType]: (funCall: FunCall): string =>
    funCall.getFilePos() + "Can only perform call on function types",

  [TypeRule.FunctionCalledWithMatchingNumberOfArgs]: (
    funCall: FunCall,
  ): string =>
    funCall.getFilePos() +
    "Function called with incorrect number of arguments!",

  [TypeRule.AllArgsInFunctionCallMatchParameter]: (funCall: FunCall): string =>
    funCall.getFilePos() +
    "Function called with argument not matching parameter type!",

  [TypeRule.NonAbstractSpatialObjectInstantiated]: (
    objectInstantiation: SpatialObjectInstantiationExpr,
  ): string =>
    objectInstantiation.getFilePos() + "Cannot instantiate abstract type!",

  [TypeRule.FullyDescribedSpatialObjectInstantiated]: (
    objectInstantiation: SpatialObjectInstantiationExpr,
  ): string =>
    objectInstantiation.getFilePos() +
    "May only instantiate a fully described spatial type!",

  [TypeRule.ArrayLiteralDeclaredWithEntriesAllMatchingType]: (
    arrayLiteral: ArrayLiteral,
  ): string =>
    arrayLiteral.getFilePos() + "Array literal has item of invalid type!",
};

function enforceTypeRules(node: ExprStmt, rulesToEnforce: TypeRule[]) {
  rulesToEnforce
    .filter((rule) => !typeRuleApplicationDictionary[rule](node))
    .forEach((failedRules) => {
      errors++;
      console.log(typeRuleFailureMessageDictionary[failedRules](node));
    });
}

//Performs type analysis to enforce typing rules
function checkType(node: ASTNode): Type {
  const typeRulesToEnforce = new Array<TypeRule>();
  if (node instanceof Type) return node;
  if (node instanceof FunDeclaration || node instanceof DeferredDecorator) {
    const oldReturnFun = returnFunction;
    returnFunction = node instanceof FunDeclaration ? node : undefined;
    if (node instanceof FunDeclaration) {
      checkType(node._body);
      returnFunction = oldReturnFun;
      node.params.forEach(checkType);
      return node._type;
    }
    node.children().forEach(checkType);
    returnFunction = oldReturnFun;
    return DefaultBaseTypeInstance.NONE;
  }
  if (node instanceof Identifier && node.declaration !== undefined)
    node._type = node.declaration._type;

  if (node instanceof If || node instanceof While) {
    if (node instanceof If) {
      checkType(node.ifStmt);
      if (node.possibleElseStmt !== null) checkType(node.possibleElseStmt);
    } else checkType(node.whileStmt);
    typeRulesToEnforce.push(TypeRule.ControlFlowConditionIsBool);
  } else if (
    node instanceof VarDeclaration ||
    (node instanceof BinaryExpr && node.operator === "=")
  )
    typeRulesToEnforce.push(
      TypeRule.AssignedToSameType,
      TypeRule.AssignedToLValue,
      TypeRule.AssignedToOnlyMutableValue,
    );
  else if (node instanceof Return)
    typeRulesToEnforce.push(TypeRule.ReturnsFunctionType);
  else if (node instanceof Match)
    typeRulesToEnforce.push(
      TypeRule.AllCaseTypeAreCompatible,
      TypeRule.CompleteMatchUnionTypeCoverage,
    );
  else if (node instanceof TypeCast)
    typeRulesToEnforce.push(TypeRule.TypeCastToContainingType);
  else if (node instanceof BinaryExpr)
    typeRulesToEnforce.push(
      node.operator === "+"
        ? TypeRule.OnlyNumbersAndStringForPlusOperation
        : node.operator === "||" || node.operator === "&&"
          ? TypeRule.OnlyBoolsUsedForBooleanOperation
          : node.operator === "==" || node.operator === "!="
            ? TypeRule.OnlyPrimitiveTypeForEqualityOperation
            : TypeRule.OnlyNumbersUsedForMathOperation,
    );
  else if (node instanceof UnaryExpr)
    typeRulesToEnforce.push(
      node.operator === "!"
        ? TypeRule.OnlyBoolsUsedForBooleanOperation
        : TypeRule.OnlyNumbersUsedForMathOperation,
    );
  else if (node instanceof ArrayAccess)
    typeRulesToEnforce.push(
      TypeRule.ArrayAccessIndexIsNumber,
      TypeRule.OnlyArrayTypesAreAccessed,
    );
  else if (node instanceof FunCall)
    typeRulesToEnforce.push(
      TypeRule.FunctionCalledOnFunctionType,
      TypeRule.FunctionCalledWithMatchingNumberOfArgs,
      TypeRule.AllArgsInFunctionCallMatchParameter,
    );
  else if (node instanceof SpatialObjectInstantiationExpr)
    typeRulesToEnforce.push(
      TypeRule.NonAbstractSpatialObjectInstantiated,
      TypeRule.FullyDescribedSpatialObjectInstantiated,
    );
  else if (node instanceof ArrayLiteral)
    typeRulesToEnforce.push(
      TypeRule.ArrayLiteralDeclaredWithEntriesAllMatchingType,
    );
  else node.children().forEach(checkType);
  if (typeRulesToEnforce.length > 0)
    enforceTypeRules(node as ExprStmt, typeRulesToEnforce);
  if (node instanceof Expr || node instanceof Stmt) return node._type;
  else return DefaultBaseTypeInstance.NONE;
}
