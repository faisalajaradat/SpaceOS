import {
  Assignment,
  ASTNode,
  ControlFlowStmt,
  ExprStmt,
  Program,
  SymbolDeclaration,
} from "./core/program.js";
import { isDecorator, isPublic } from "./utils.js";
import {
  AliasTypeDeclaration,
  Block,
  CaseStmt,
  DeferDecorator,
  If,
  ImportDeclaration,
  libDeclarations,
  libFunctions,
  Match,
  Parameter,
  RecordDeclaration,
  Return,
  Stmt,
  UnionDeclaration,
  VarDeclaration,
  While,
} from "./core/stmts.js";
import { Expr, Identifier } from "./core/expr/Expr.js";
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
  DirectionDecorator,
  EnclosedSpaceType,
  FunctionType,
  FunDeclaration,
  MotionDecorator,
  OpenSpaceType,
  PathType,
  RecordLiteral,
  RecordType,
  SmartEntityType,
  SpacePathGraphType,
  SpaceType,
  SpatialObjectInstantiationExpr,
  StaticEntityType,
  Type,
  UnaryExpr,
  UnionType,
} from "./core/index.js";
import { TypeCast } from "./core/expr/TypeCast.js";
import { FunCall } from "./core/expr/FunCall.js";
import { grammar } from "./grammar.js";
import { readFileSync } from "fs";
import { ast } from "./ast.js";
import { SymbolAccess } from "./core/expr/SymbolAccess.js";

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
    super((unionDeclaration.type as UnionType).identifier.value);
    this.unionDeclaration = unionDeclaration;
  }
}

export class AliasTypeSymbol extends ProgramSymbol {
  aliasTypeDeclaration: AliasTypeDeclaration;

  constructor(aliasTypeDeclaration: AliasTypeDeclaration) {
    super(aliasTypeDeclaration.alias.value);
    this.aliasTypeDeclaration = aliasTypeDeclaration;
  }
}

export class ImportSymbol extends ProgramSymbol {
  importDeclaration: ImportDeclaration;

  constructor(importDeclaration: ImportDeclaration) {
    super(importDeclaration.alias.value);
    this.importDeclaration = importDeclaration;
  }
}

export class RecordSymbol extends ProgramSymbol {
  recordDeclaration: RecordDeclaration;

  constructor(recordDeclaration: RecordDeclaration) {
    super((recordDeclaration.type as RecordType).identifier.value);
    this.recordDeclaration = recordDeclaration;
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
    visitNameAnalyzer(node.children()[0], scope);
    let curScope = scope;
    while (curScope.outer !== null) curScope = curScope.outer;
    curScope = new Scope(curScope);
    node.params.forEach((param) => visitNameAnalyzer(param, curScope));
    visitNameAnalyzer(node._body, curScope);
    node.scope = curScope;
  } else if (node instanceof VarDeclaration || node instanceof Parameter) {
    if (node.identifier.value === "_") return;
    visitNameAnalyzer(node.children()[0], scope);
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
      (<UnionType>node.type).identifier.value,
    );
    if (unionSymbol !== null) {
      errors++;
      console.log(
        node.getFilePos() +
          "Type name: " +
          (<UnionType>node.type).identifier.value +
          " already defined within scope!",
      );
    } else scope.put(new UnionSymbol(node));
  } else if (node instanceof AliasTypeDeclaration) {
    visitNameAnalyzer(node.aliasedType, scope);
    const aliasSymbol = scope.lookupCurrent(node.alias.value);
    if (aliasSymbol !== null) {
      errors++;
      console.log(
        node.getFilePos() +
          "Type name: " +
          node.alias.value +
          " already defined within scope!",
      );
    } else scope.put(new AliasTypeSymbol(node));
  } else if (node instanceof ImportDeclaration) {
    const importSymbol = scope.lookupCurrent(node.alias.value);
    if (importSymbol !== null) {
      errors++;
      console.log(
        node.getFilePos() +
          "Import alias: " +
          node.alias.value +
          " already defined within scope!",
      );
      return;
    }
    try {
      const importedFile = readFileSync(node.path, "utf-8");
      const importedMatch = grammar.match(importedFile);
      if (importedMatch.failed()) {
        console.log(importedMatch.message);
        return;
      }
      const importedProgram: Program = ast(importedMatch);
      const semanticErrors = analyze(importedProgram);
      errors += semanticErrors;
      if (semanticErrors) return;
      node.importedSymbols = importedProgram.stmts.filter(
        isPublic,
      ) as VarDeclaration[];
      scope.put(new ImportSymbol(node));
      node.alias.declaration = node;
    } catch (err) {
      errors++;
      console.log(
        node.getFilePos() + "Cannot import file at path: " + node.path,
      );
      return;
    }
  } else if (node instanceof RecordDeclaration) {
    const recordSymbol = scope.lookupCurrent(
      (node.type as RecordType).identifier.value,
    );
    if (recordSymbol !== null) {
      errors++;
      console.log(
        node.getFilePos() +
          "Record: " +
          (node.type as RecordType).identifier.value +
          " already defined within scope!",
      );
      return;
    }
    scope.put(new RecordSymbol(node));
    (node.type as RecordType).identifier.declaration = node;
    node.fields.forEach((field) => visitNameAnalyzer(field.paramType, scope));
    node.fields
      .map((field) => {
        let fieldBaseType = field.paramType;
        while (fieldBaseType instanceof ArrayType)
          fieldBaseType = fieldBaseType.type;
        return fieldBaseType;
      })
      .filter((fieldType) => fieldType instanceof RecordType)
      .forEach((fieldType) => visitNameAnalyzer(fieldType, scope));
  } else if (node instanceof Block) {
    const curScope = new Scope(scope);
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
    node.scope = curScope;
  } else if (node instanceof CaseStmt) {
    const curScope = new Scope(scope);
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
    node.scope = curScope;
  } else if (node instanceof DeferDecorator) {
    node.scopeArgs.forEach((arg) => visitNameAnalyzer(arg, scope));
    node.scopeParams = node.scopeArgs.map(
      (arg) => new Parameter(arg.declaration.type, arg, arg.line, arg.column),
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
    else if (programSymbol instanceof AliasTypeSymbol)
      node.declaration = programSymbol.aliasTypeDeclaration;
    else if (programSymbol instanceof ImportSymbol)
      node.declaration = programSymbol.importDeclaration;
    else if (programSymbol instanceof RecordSymbol)
      node.declaration = programSymbol.recordDeclaration;
  } else node.children().forEach((child) => visitNameAnalyzer(child, scope));
}

let returnFunction: FunDeclaration = undefined;
let hasReturned = false;

function assignArraySize(type1: ArrayType, type2: ArrayType) {
  while (type1.type instanceof ArrayType && type2.type instanceof ArrayType) {
    type1._size = type2._size;
    type1 = type1.type;
    type2 = type2.type;
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
  OnlyArrayTypesAreAccessedWithIndex,
  FunctionCalledOnFunctionType,
  FunctionCalledWithMatchingNumberOfArgs,
  AllArgsInFunctionCallMatchParameter,
  NonAbstractSpatialObjectInstantiated,
  FullyDescribedSpatialObjectInstantiated,
  SpatialObjectInstantiatedWithCompatibleArguments,
  ArrayLiteralDeclaredWithEntriesAllMatchingType,
  OnlyAccessibleSymbolAccessed,
  AccessedFieldExists,
  RecordLiteralDeclaredWithEntriesMatchingFieldType,
  FunctionReturnsValueIfExpected,
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
        ? assignment.type
        : checkType(assignment.leftExpr);
    const rightHandType =
      assignment instanceof VarDeclaration
        ? checkType(assignment.value)
        : checkType(assignment.rightExpr);
    const isSameType = leftHandType.equals(rightHandType);
    if (leftHandType instanceof ArrayType && rightHandType instanceof ArrayType)
      assignArraySize(leftHandType, rightHandType);
    assignment.type = isSameType
      ? leftHandType
      : new BaseType(BaseTypeKind.NONE, assignment.column, assignment.line);
    return isSameType;
  },

  [TypeRule.ReturnsFunctionType]: (returnStmt: Return): boolean => {
    hasReturned = true;
    if (returnStmt.possibleValue === undefined)
      return (
        returnFunction === undefined ||
        (returnFunction.type as FunctionType).returnType.equals(
          DefaultBaseTypeInstance.VOID,
        )
      );
    return (
      returnFunction !== undefined &&
      checkType(returnStmt.possibleValue).equals(
        (returnFunction.type as FunctionType).returnType,
      )
    );
  },

  [TypeRule.AllCaseTypeAreCompatible]: (matchStmt: Match): boolean => {
    const subjectType = checkType(matchStmt.subject);
    return (
      matchStmt.caseStmts.filter((caseStmt) => {
        const caseType = checkType(caseStmt.matchCondition);
        caseStmt.type = caseType;
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
          ).options.filter((typeOption) => typeOption.equals(caseStmt.type))
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
    typeCast.type instanceof CompositionType &&
    typeCast.type.contains(checkType(typeCast.castedExpr)),

  [TypeRule.OnlyNumbersAndStringForPlusOperation]: (
    additionExpr: BinaryExpr,
  ): boolean => {
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

    additionExpr.type = new BaseType(
      !bothAreValid
        ? BaseTypeKind.NONE
        : eitherSideIsString
          ? BaseTypeKind.STRING
          : BaseTypeKind.NUMBER,
      additionExpr.column,
      additionExpr.line,
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

    mathExpr.type = new BaseType(
      !bothSidesAreNumbers
        ? BaseTypeKind.NONE
        : operatorCreatesBool
          ? BaseTypeKind.BOOL
          : BaseTypeKind.NUMBER,
      mathExpr.column,
      mathExpr.line,
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
    equalityExpr.type = new BaseType(
      bothSidesAreTheSamePrimitiveType ? BaseTypeKind.BOOL : BaseTypeKind.NONE,
      equalityExpr.column,
      equalityExpr.line,
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
    booleanExpr.type = new BaseType(
      bothSidesAreBools ? BaseTypeKind.BOOL : BaseTypeKind.NONE,
      booleanExpr.column,
      booleanExpr.line,
    );
    return bothSidesAreBools;
  },

  [TypeRule.ArrayAccessIndexIsNumber]: (arrayAccess: ArrayAccess): boolean =>
    checkType(arrayAccess.accessExpr).equals(DefaultBaseTypeInstance.NUMBER),

  [TypeRule.OnlyArrayTypesAreAccessedWithIndex]: (
    arrayAccess: ArrayAccess,
  ): boolean => {
    const arrayType = checkType(arrayAccess.arrayExpr);
    const isArrayType = arrayType instanceof ArrayType;
    arrayAccess.type = isArrayType
      ? arrayType.type
      : new BaseType(BaseTypeKind.NONE, arrayAccess.column, arrayAccess.line);
    return isArrayType;
  },

  [TypeRule.FunctionCalledOnFunctionType]: (funCall: FunCall): boolean => {
    const calledSubjectType = checkType(funCall.identifier);
    funCall.identifier.type = calledSubjectType;
    const isFunctionType = calledSubjectType instanceof FunctionType;
    funCall.type = isFunctionType
      ? calledSubjectType.returnType
      : new BaseType(BaseTypeKind.NONE, funCall.column, funCall.line);
    return isFunctionType;
  },

  [TypeRule.FunctionCalledWithMatchingNumberOfArgs]: (
    funCall: FunCall,
  ): boolean =>
    funCall.args.length ===
    (funCall.identifier.type as FunctionType).paramTypes.length,

  [TypeRule.AllArgsInFunctionCallMatchParameter]: (
    funCall: FunCall,
  ): boolean => {
    if (funCall.identifier instanceof SymbolAccess) {
      const spgType = checkType(funCall.identifier.locationExpr);
      if (spgType instanceof SpacePathGraphType) {
        if (funCall.identifier.symbol.value === "setRoot")
          return new SpaceType().contains(checkType(funCall.args[0]));
        if (funCall.identifier.symbol.value === "addPathSpace")
          return (
            new PathType().contains(checkType(funCall.args[0])) &&
            new SpaceType().contains(checkType(funCall.args[1]))
          );
      }
    }
    if (
      !(funCall.identifier instanceof Identifier) ||
      funCall.identifier.value !== "push"
    )
      return (
        funCall.args.filter(
          (arg, pos) =>
            !checkType(arg).equals(
              (funCall.identifier.type as FunctionType).paramTypes[pos],
            ),
        ).length === 0
      );
    const arg0Type = checkType(funCall.args[0]);
    return (
      arg0Type instanceof ArrayType &&
      checkType(funCall.args[1]).equals(arg0Type.type)
    );
  },

  [TypeRule.NonAbstractSpatialObjectInstantiated]: (
    objectInstantiation: SpatialObjectInstantiationExpr,
  ): boolean => {
    let baseObjectType = objectInstantiation.type;
    while (isDecorator(baseObjectType))
      baseObjectType = baseObjectType.delegate;
    return (
      baseObjectType instanceof SpacePathGraphType ||
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
    (isDecorator(objectInstantiation.type) &&
      (objectInstantiation.type.delegate instanceof DirectionDecorator ||
        (objectInstantiation.type.delegate instanceof ControlDecorator &&
          (objectInstantiation.type.delegate.delegate instanceof SpaceType ||
            objectInstantiation.type.delegate.delegate instanceof
              StaticEntityType ||
            objectInstantiation.type.delegate.delegate instanceof
              MotionDecorator)))) ||
    objectInstantiation.type instanceof SpacePathGraphType,

  [TypeRule.SpatialObjectInstantiatedWithCompatibleArguments]: (
    objectInstantiation: SpatialObjectInstantiationExpr,
  ): boolean => {
    let baseType = objectInstantiation.type;
    while (isDecorator(baseType)) baseType = baseType.delegate;
    if (
      objectInstantiation.args.length === 0 &&
      !(baseType instanceof SpaceType || baseType instanceof SpacePathGraphType)
    )
      return true;
    if (objectInstantiation.args.length === 0) return false;
    if (baseType instanceof SpacePathGraphType) {
      if (objectInstantiation.args.length > 1) return false;
      return new SpaceType().contains(checkType(objectInstantiation.args[0]));
    }
    if (!(baseType instanceof SpaceType))
      return (
        objectInstantiation.args.length === 1 &&
        checkType(objectInstantiation.args[0]).equals(
          DefaultBaseTypeInstance.STRING,
        )
      );

    let argumentsAreCompatible = checkType(objectInstantiation.args[0]).equals(
      libDeclarations[0].type,
    );
    if (objectInstantiation.args.length > 1)
      argumentsAreCompatible =
        argumentsAreCompatible &&
        checkType(objectInstantiation.args[1]).equals(
          DefaultBaseTypeInstance.NUMBER,
        );
    if (objectInstantiation.args.length > 2)
      argumentsAreCompatible =
        argumentsAreCompatible &&
        checkType(objectInstantiation.args[2]).equals(
          DefaultBaseTypeInstance.STRING,
        );
    return argumentsAreCompatible && objectInstantiation.args.length < 4;
  },

  [TypeRule.ArrayLiteralDeclaredWithEntriesAllMatchingType]: (
    arrayLiteral: ArrayLiteral,
  ): boolean => {
    arrayLiteral.type = new ArrayType(
      checkType(arrayLiteral.value[0]),
      arrayLiteral.value.length,
      arrayLiteral.line,
      arrayLiteral.column,
    );
    return (
      arrayLiteral.value.filter(
        (expr) =>
          !(arrayLiteral.type as ArrayType).type.equals(checkType(expr)),
      ).length === 0
    );
  },

  [TypeRule.OnlyAccessibleSymbolAccessed]: (
    symbolAccess: SymbolAccess,
  ): boolean => {
    if (
      symbolAccess.locationExpr instanceof Identifier &&
      symbolAccess.locationExpr.declaration instanceof ImportDeclaration
    )
      return true;
    const locationType = checkType(symbolAccess.locationExpr);
    symbolAccess.locationExpr.type =
      locationType instanceof RecordType ||
      locationType instanceof SpacePathGraphType
        ? locationType
        : DefaultBaseTypeInstance.NONE;
    return !symbolAccess.locationExpr.type.equals(DefaultBaseTypeInstance.NONE);
  },

  [TypeRule.AccessedFieldExists]: (symbolAccess: SymbolAccess): boolean => {
    if (
      symbolAccess.locationExpr instanceof Identifier &&
      symbolAccess.locationExpr.declaration instanceof ImportDeclaration
    ) {
      symbolAccess.symbol.declaration =
        symbolAccess.locationExpr.declaration.importedSymbols.filter(
          (importSymbol) =>
            importSymbol.identifier.value === symbolAccess.symbol.value,
        )[0];
      symbolAccess.type =
        symbolAccess.symbol.declaration !== undefined
          ? symbolAccess.symbol.declaration.type
          : DefaultBaseTypeInstance.NONE;
    } else if (symbolAccess.locationExpr.type instanceof SpacePathGraphType) {
      const maybeStringType = new UnionType(new Identifier("MaybeString"));
      maybeStringType.identifier.declaration = libDeclarations[1];
      symbolAccess.type =
        Array.from(SpacePathGraphType.libMethods.keys())
          .filter((methodName) => methodName === symbolAccess.symbol.value)
          .map((matchedMethod) => {
            if (matchedMethod === "setRoot")
              return new FunctionType(maybeStringType, [new SpaceType()]);
            if (matchedMethod === "addPathSpace")
              return new FunctionType(maybeStringType, [
                new PathType(),
                new SpaceType(),
              ]);
            if (matchedMethod === "getStructJSON")
              return new FunctionType(DefaultBaseTypeInstance.STRING, []);
          })[0] ?? DefaultBaseTypeInstance.NONE;
    } else if (symbolAccess.locationExpr.type instanceof RecordType) {
      symbolAccess.type =
        (
          symbolAccess.locationExpr.type.identifier
            .declaration as RecordDeclaration
        ).fields
          .filter(
            (field) => field.identifier.value === symbolAccess.symbol.value,
          )
          .map((matchedField) => matchedField.type)[0] ??
        DefaultBaseTypeInstance.NONE;
    } else symbolAccess.type = DefaultBaseTypeInstance.NONE;
    return !symbolAccess.type.equals(DefaultBaseTypeInstance.NONE);
  },

  [TypeRule.RecordLiteralDeclaredWithEntriesMatchingFieldType]: (
    recordLiteral: RecordLiteral,
  ): boolean =>
    recordLiteral.fieldValues
      .map(checkType)
      .filter(
        (fieldType, pos) =>
          !(
            (recordLiteral.type as RecordType).identifier
              .declaration as RecordDeclaration
          ).fields[pos].type.equals(fieldType),
      ).length === 0,

  [TypeRule.FunctionReturnsValueIfExpected]: (
    funDeclaration: FunDeclaration,
  ): boolean => {
    const oldReturnFun = returnFunction;
    returnFunction = funDeclaration;
    const oldHasReturn = hasReturned;
    hasReturned = false;
    checkType(funDeclaration._body);
    const localHasReturned =
      hasReturned ||
      (funDeclaration.type as FunctionType).returnType.equals(
        DefaultBaseTypeInstance.VOID,
      );
    hasReturned = oldHasReturn;
    returnFunction = oldReturnFun;
    if (localHasReturned) funDeclaration.params.forEach(checkType);
    return localHasReturned;
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

  [TypeRule.OnlyNumbersAndStringForPlusOperation]: (
    additionExpr: BinaryExpr,
  ): string =>
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

  [TypeRule.OnlyArrayTypesAreAccessedWithIndex]: (
    arrayAccess: ArrayAccess,
  ): string =>
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

  [TypeRule.SpatialObjectInstantiatedWithCompatibleArguments]: (
    objectInstantiation: SpatialObjectInstantiationExpr,
  ): string =>
    objectInstantiation.getFilePos() +
    "May only instantiate a spatial type with all required arguments of correct type!",

  [TypeRule.ArrayLiteralDeclaredWithEntriesAllMatchingType]: (
    arrayLiteral: ArrayLiteral,
  ): string =>
    arrayLiteral.getFilePos() + "Array literal has item of invalid type!",

  [TypeRule.OnlyAccessibleSymbolAccessed]: (
    symbolAccess: SymbolAccess,
  ): string =>
    symbolAccess.getFilePos() + "Symbol access on non accessible type!",

  [TypeRule.AccessedFieldExists]: (symbolAccess: SymbolAccess): string =>
    symbolAccess.getFilePos() + "Symbol accesed does not exist!",

  [TypeRule.RecordLiteralDeclaredWithEntriesMatchingFieldType]: (
    recordLiteral: RecordLiteral,
  ): string =>
    recordLiteral.getFilePos() +
    "Record literal has argument not matching corresponding field's type!",
  [TypeRule.FunctionReturnsValueIfExpected]: (
    funDeclaration: FunDeclaration,
  ): string =>
    funDeclaration.getFilePos() +
    "Function does not return a value when one is expected!",
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
  if (node === undefined) return DefaultBaseTypeInstance.NONE;
  if (node instanceof Type) return node;
  if (node instanceof DeferDecorator) {
    const oldReturnFun = returnFunction;
    returnFunction = undefined;
    node.children().forEach(checkType);
    returnFunction = oldReturnFun;
    return DefaultBaseTypeInstance.NONE;
  }
  if (node instanceof Identifier && node.declaration !== undefined)
    node.type = node.declaration.type;
  if (
    node instanceof FunDeclaration &&
    (!(node._body instanceof Block) || node._body.stmts.length > 0)
  )
    typeRulesToEnforce.push(TypeRule.FunctionReturnsValueIfExpected);
  else if (node instanceof If || node instanceof While) {
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
  else if (node instanceof Match) {
    node.caseStmts.forEach((caseStmt) => checkType(caseStmt.stmt));
    typeRulesToEnforce.push(
      TypeRule.AllCaseTypeAreCompatible,
      TypeRule.CompleteMatchUnionTypeCoverage,
    );
  } else if (node instanceof TypeCast)
    typeRulesToEnforce.push(TypeRule.TypeCastToContainingType);
  else if (node instanceof BinaryExpr) {
    typeRulesToEnforce.push(
      node.operator === "+"
        ? TypeRule.OnlyNumbersAndStringForPlusOperation
        : node.operator === "||" || node.operator === "&&"
          ? TypeRule.OnlyBoolsUsedForBooleanOperation
          : node.operator === "==" || node.operator === "!="
            ? TypeRule.OnlyPrimitiveTypeForEqualityOperation
            : TypeRule.OnlyNumbersUsedForMathOperation,
    );
  } else if (node instanceof UnaryExpr)
    typeRulesToEnforce.push(
      node.operator === "!"
        ? TypeRule.OnlyBoolsUsedForBooleanOperation
        : TypeRule.OnlyNumbersUsedForMathOperation,
    );
  else if (node instanceof ArrayAccess)
    typeRulesToEnforce.push(
      TypeRule.ArrayAccessIndexIsNumber,
      TypeRule.OnlyArrayTypesAreAccessedWithIndex,
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
      TypeRule.SpatialObjectInstantiatedWithCompatibleArguments,
    );
  else if (node instanceof ArrayLiteral)
    typeRulesToEnforce.push(
      TypeRule.ArrayLiteralDeclaredWithEntriesAllMatchingType,
    );
  else if (node instanceof SymbolAccess)
    typeRulesToEnforce.push(
      TypeRule.OnlyAccessibleSymbolAccessed,
      TypeRule.AccessedFieldExists,
    );
  else if (node instanceof RecordLiteral)
    typeRulesToEnforce.push(
      TypeRule.RecordLiteralDeclaredWithEntriesMatchingFieldType,
    );
  else node.children().forEach(checkType);
  if (typeRulesToEnforce.length > 0)
    enforceTypeRules(node as ExprStmt, typeRulesToEnforce);
  if (node instanceof Expr || node instanceof Stmt) return node.type;
  else return DefaultBaseTypeInstance.NONE;
}
