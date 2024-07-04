import { grammar } from "./grammar.js";
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
  UnionDeclaration,
  VarDeclaration,
  While,
} from "./core/stmts.js";
import {
  AirPathType,
  AnimateEntityType,
  ArrayAccess,
  ArrayLiteral,
  ArrayType,
  BaseType,
  BaseTypeKind,
  BidirectionalDecorator,
  BinaryExpr,
  BoolLiteral,
  ControlledDecorator,
  DynamicEntityType,
  EnclosedSpaceType,
  EntityFactoryType,
  EntityType,
  FunctionType,
  FunDeclaration,
  LandPathType,
  LocalityDecorator,
  MobileDecorator,
  NoneLiteral,
  NotControlledDecorator,
  NumberLiteral,
  OpenSpaceType,
  PathFactoryType,
  PathType,
  PhysicalDecorator,
  RecordLiteral,
  RecordType,
  SmartEntityType,
  SpaceFactoryType,
  SpacePathGraphType,
  SpaceType,
  SpatialObjectInstantiationExpr,
  SpatialObjectType,
  SpatialType,
  StaticEntityType,
  StationaryDecorator,
  StringLiteral,
  UnaryExpr,
  UnidirectionalDecorator,
  UnionType,
  VirtualDecorator,
} from "./core/index.js";
import { Program } from "./core/program.js";
import { TypeCast } from "./core/expr/TypeCast.js";
import { FunCall } from "./core/expr/FunCall.js";
import { MatchResult } from "ohm-js";
import { SymbolAccess } from "./core/expr/SymbolAccess.js";
import { Identifier } from "./core/expr/Expr.js";

export function ast(match: MatchResult) {
  return astBuilder(match).ast();
}

//Describe how to build AST for each Ohm rule
const astBuilder = grammar.createSemantics().addOperation("ast", {
  Program(stmts) {
    const lineAndColumn = this.source.getLineAndColumn();
    const _program = new Program(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      stmts.ast(),
    );
    _program.stmts.unshift(...libDeclarations);
    libFunctions.forEach((_value, key) => _program.stmts.unshift(key));
    return _program;
  },
  Stmt_simple(simpleStatements, _newline) {
    return simpleStatements.ast()[0];
  },
  Stmt_compound(possibleDeferDecorator, compoundStatement) {
    const compoundStmt = compoundStatement.ast();
    const deferDecorator = possibleDeferDecorator.ast()[0];
    if (deferDecorator === undefined) return compoundStmt;
    (<DeferDecorator>deferDecorator).delegate = compoundStmt;
    return deferDecorator;
  },
  SimpleStmts(nonemptyListWithOptionalEndSep) {
    return nonemptyListWithOptionalEndSep.ast();
  },
  SimpleStmt_return(returnKeyword, possibleExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new Return(
      possibleExpression.ast()[0],
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  SimpleStmt(simpleStmt) {
    return simpleStmt.ast();
  },
  CompoundStmt_block(block) {
    return block.ast();
  },
  CompoundStmt_if(
    ifKeyword,
    expression,
    ifStatement,
    possibleElseKeyword,
    possibleElseStatement,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new If(
      expression.ast(),
      ifStatement.ast(),
      possibleElseStatement.ast()[0] ?? null,
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  CompoundStmt_while(whileKeyword, expression, statement) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new While(
      expression.ast(),
      statement.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  CompoundStmt_match(
    _match,
    expression,
    _leftBracket,
    caseStmts,
    _rightBracket,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new Match(
      expression.ast(),
      caseStmts.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  CaseStmt(condition, _arrow, stmt) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new CaseStmt(
      condition.ast(),
      stmt.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  Exp(assignExpression) {
    return assignExpression.ast();
  },
  AssignExp_assign(unaryExpression, _equal, assignExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BinaryExpr(
      null,
      _equal.sourceString,
      unaryExpression.ast(),
      assignExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  AssignExp(lorExpression) {
    return lorExpression.ast();
  },
  LorExp_lor(lorExpression, _lor, larExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BinaryExpr(
      null,
      _lor.sourceString,
      lorExpression.ast(),
      larExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  LorExp(larExpression) {
    return larExpression.ast();
  },
  LarExp_lar(larExpression, _lar, eqExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BinaryExpr(
      null,
      _lar.sourceString,
      larExpression.ast(),
      eqExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  LarExp(eqExpression) {
    return eqExpression.ast();
  },
  EqExp_eq(eqExpression, operator, relExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BinaryExpr(
      null,
      operator.sourceString,
      eqExpression.ast(),
      relExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  EqExp(relExpression) {
    return relExpression.ast();
  },
  RelExp_rel(relExpression, operator, addExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BinaryExpr(
      null,
      operator.sourceString,
      relExpression.ast(),
      addExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  RelExp(addExpression) {
    return addExpression.ast();
  },
  AddExp_add(addExpression, operator, multExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BinaryExpr(
      null,
      operator.sourceString,
      addExpression.ast(),
      multExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  AddExp(multExpression) {
    return multExpression.ast();
  },
  MultExp_mult(multExpression, operator, unaryExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BinaryExpr(
      null,
      operator.sourceString,
      multExpression.ast(),
      unaryExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  MultExp(unaryExpression) {
    return unaryExpression.ast();
  },
  UnaryExp_unary(operator, unaryExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new UnaryExpr(
      null,
      operator.sourceString,
      unaryExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  UnaryExp_typecast(
    _leftParenthesis,
    _type,
    _rightParenthesis,
    unaryExpression,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new TypeCast(
      _type.ast(),
      unaryExpression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  UnaryExp_new(_new, spatialType, _leftParenthesis, args, _rightParenthesis) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new SpatialObjectInstantiationExpr(
      spatialType.ast(),
      args.asIteration().ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  UnaryExp(leftExpression) {
    return leftExpression.ast();
  },
  LeftExp_call(
    leftExpression,
    _leftParenthesis,
    listOfExpressions,
    _rightParenthesis,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new FunCall(
      null,
      leftExpression.ast(),
      listOfExpressions.asIteration().ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  LeftExp_array(
    leftExpression,
    _leftSquareBracket,
    expression,
    _rightSquareBracket,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new ArrayAccess(
      leftExpression.ast(),
      expression.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  LeftExp_access(leftExpression, _period, identifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new SymbolAccess(
      leftExpression.ast(),
      identifier.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  LeftExp(primaryExpression) {
    return primaryExpression.ast();
  },
  PrimaryExp_group(_leftParenthesis, expression, _rightParenthesis) {
    return expression.ast();
  },
  PrimaryExp_array(_leftSquareBracket, listOfExpressions, _rightSquareBracket) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new ArrayLiteral(
      listOfExpressions.asIteration().ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  PrimaryExp_function(
    type,
    _leftParenthesis,
    listOfParameters,
    _rightParenthesis,
    stmt,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    const params =
      listOfParameters.sourceString === "none"
        ? []
        : listOfParameters.asIteration().ast();
    return new FunDeclaration(
      type.ast(),
      params,
      stmt.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  PrimaryExp_record(
    recordType,
    _leftBracket,
    listOfExpressions,
    _rightBracket,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new RecordLiteral(
      recordType.ast(),
      listOfExpressions.asIteration().ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  PrimaryExp(expression) {
    return expression.ast();
  },
  Block(_leftBracket, statements, _rightBracket) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new Block(
      statements.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  VarDeclaration(possiblePub, parameter, _equal, expression) {
    const lineAndColumn = this.source.getLineAndColumn();
    const typeAndIdentifier = parameter.ast();
    return new VarDeclaration(
      typeAndIdentifier._type,
      typeAndIdentifier.identifier,
      expression.ast(),
      possiblePub.sourceString === "pub",
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  UnionDeclaration(unionType, _equal, listOfTypes) {
    const lineAndColumn = this.source.getLineAndColumn();
    const types = listOfTypes.asIteration().ast();
    return types.length > 1
      ? new UnionDeclaration(
          unionType.ast(),
          types,
          lineAndColumn.lineNum,
          lineAndColumn.colNum,
        )
      : new AliasTypeDeclaration(
          (unionType.ast() as UnionType).identifier,
          types[0],
          lineAndColumn.lineNum,
          lineAndColumn.colNum,
        );
  },
  ImportDeclaration(_import, stringLiteral, _as, identifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new ImportDeclaration(
      (stringLiteral.ast() as StringLiteral).value,
      identifier.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  RecordDeclaration(recordType, _leftBracket, listOfParameters, _rightBracket) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new RecordDeclaration(
      recordType.ast(),
      listOfParameters.asIteration().ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  DeferDecorator(
    _defer,
    _leftParenthesis,
    listOfIdentifiers,
    _rightParenthesis,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new DeferDecorator(
      listOfIdentifiers.asIteration().ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  Parameter(type, identifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new Parameter(
      type.ast(),
      identifier.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  Type(baseTypeDef, typeSpecifiers) {
    const baseType = baseTypeDef.ast();
    const numOfSpecifiers = typeSpecifiers.ast() as (
      | ArrayType
      | FunctionType
    )[];
    let fullType = baseType;
    numOfSpecifiers.forEach((specifier) => {
      if (specifier instanceof ArrayType) {
        (specifier as ArrayType).type = fullType;
        fullType = specifier;
      } else if (specifier instanceof FunctionType) {
        (specifier as FunctionType).returnType = fullType;
        fullType = specifier;
      }
    });
    return fullType;
  },
  baseTypeKeyword(keyword) {
    const lineAndColumn = this.source.getLineAndColumn();
    let baseTypeKind = BaseTypeKind.NONE;
    switch (keyword.sourceString) {
      case "number":
        baseTypeKind = BaseTypeKind.NUMBER;
        break;
      case "string":
        baseTypeKind = BaseTypeKind.STRING;
        break;
      case "bool":
        baseTypeKind = BaseTypeKind.BOOL;
        break;
      case "void":
        baseTypeKind = BaseTypeKind.VOID;
        break;
    }
    return new BaseType(
      baseTypeKind,
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  UnionType(_union, identifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new UnionType(
      identifier.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  RecordType(_record, identifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new RecordType(
      identifier.ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  TypeSpecifier_array(specifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new ArrayType(null, lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  TypeSpecifier_function(_leftParenthesis, listOfTypes, _rightParenthesis) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new FunctionType(
      null,
      listOfTypes.asIteration().ast(),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  SpatialType(spatialType) {
    return spatialType.ast();
  },
  PhysicalPathType(possibleDirection, airOrLandPath) {
    const lineAndColumn = this.source.getLineAndColumn();
    const directionDescriptor = possibleDirection.ast()[0];
    const physicalPathType = airOrLandPath.ast();
    if (directionDescriptor !== undefined)
      (physicalPathType as LocalityDecorator).delegate =
        directionDescriptor === "unidirectional"
          ? new UnidirectionalDecorator(
              (physicalPathType as LocalityDecorator).delegate as PathType,
              lineAndColumn.lineNum,
              lineAndColumn.colNum,
            )
          : new BidirectionalDecorator(
              (physicalPathType as LocalityDecorator).delegate as PathType,
              lineAndColumn.lineNum,
              lineAndColumn.colNum,
            );
    return physicalPathType;
  },
  PathType(possibleDirection, path) {
    const lineAndColumn = this.source.getLineAndColumn();
    const directionDescriptor = possibleDirection.ast()[0];
    const pathType = path.ast();
    return directionDescriptor === undefined
      ? pathType
      : directionDescriptor === "unidirectional"
        ? new UnidirectionalDecorator(
            pathType,
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
          )
        : new BidirectionalDecorator(
            pathType,
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
          );
  },
  MaybeVirtualSpatialType(possibleVirtualOrPhysical, spatialType) {
    const maybeVirtualSpatialType: SpatialType = spatialType.ast();
    const localityDescriptor = possibleVirtualOrPhysical.ast()[0];
    const localityLineAndColumn =
      possibleVirtualOrPhysical.source.getLineAndColumn();
    return localityDescriptor === undefined
      ? maybeVirtualSpatialType
      : localityDescriptor === "physical"
        ? new PhysicalDecorator(
            maybeVirtualSpatialType,
            localityLineAndColumn.lineNum,
            localityLineAndColumn.colNum,
          )
        : new VirtualDecorator(
            maybeVirtualSpatialType,
            localityLineAndColumn.lineNum,
            localityLineAndColumn.colNum,
          );
  },
  MaybeImmutableSpatialType(possibleImmutableOrMutable, spatialType) {
    const maybeImmutableSpatialType: SpatialObjectType = spatialType.ast();
    const controlDescriptor = possibleImmutableOrMutable.ast()[0];
    const controlLineAndColumn =
      possibleImmutableOrMutable.source.getLineAndColumn();
    return controlDescriptor === undefined
      ? maybeImmutableSpatialType
      : controlDescriptor === "mutable"
        ? new ControlledDecorator(
            maybeImmutableSpatialType,
            controlLineAndColumn.lineNum,
            controlLineAndColumn.colNum,
          )
        : new NotControlledDecorator(
            maybeImmutableSpatialType,
            controlLineAndColumn.lineNum,
            controlLineAndColumn.colNum,
          );
  },
  MaybeMobileSpatialType(possibleMobileOrStationary, spatialType) {
    const maybeMobileSpatialType: DynamicEntityType = spatialType.ast();
    const motionDescriptor = possibleMobileOrStationary.ast()[0];
    const motionLineAndColumn =
      possibleMobileOrStationary.source.getLineAndColumn();
    return motionDescriptor === undefined
      ? maybeMobileSpatialType
      : motionDescriptor === "stationary"
        ? new StationaryDecorator(
            maybeMobileSpatialType,
            motionLineAndColumn.lineNum,
            motionLineAndColumn.colNum,
          )
        : new MobileDecorator(
            maybeMobileSpatialType,
            motionLineAndColumn.lineNum,
            motionLineAndColumn.colNum,
          );
  },
  physical(_physical) {
    return this.sourceString;
  },
  virtual(_virtual) {
    return this.sourceString;
  },
  mutable(_mutable) {
    return this.sourceString;
  },
  immutable(_immutable) {
    return this.sourceString;
  },
  stationary(_stationary) {
    return this.sourceString;
  },
  mobile(_mobile) {
    return this.sourceString;
  },
  unidirectional(_unidirectional) {
    return this.sourceString;
  },
  bidirectional(_bidirectional) {
    return this.sourceString;
  },
  spatialTypeKeyword(_spatialType) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new SpatialType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  landPath(_landPath) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new PhysicalDecorator(
      new LandPathType(lineAndColumn.lineNum, lineAndColumn.colNum),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  airPath(_airPath) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new PhysicalDecorator(
      new AirPathType(lineAndColumn.lineNum, lineAndColumn.colNum),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  spaceFactory(_spaceFactory) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new SpaceFactoryType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  entityFactory(_entityFactory) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new EntityFactoryType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  pathFactory(_pathFactory) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new PathFactoryType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  path(_path) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new PathType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  spaceKeyword(_space) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new SpaceType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  openSpace(_openSpace) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new OpenSpaceType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  enclosedSpace(_enclosedSpace) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new EnclosedSpaceType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  entity(_entity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new EntityType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  staticEntity(_staticEntity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new StaticEntityType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  dynamicEntity(_dynamicEntity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new DynamicEntityType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  animateEntity(_animateEntity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new AnimateEntityType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  smartEntity(_smartEntity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new SmartEntityType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  spacePathGraph(_spacePathGraph) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new SpacePathGraphType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  wildcard(_underscore) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new Parameter(
      new BaseType(BaseTypeKind.ANY),
      new Identifier("_", lineAndColumn.lineNum, lineAndColumn.colNum),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  funKeyword(_funKeyword) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BaseType(
      BaseTypeKind.ANY,
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  varKeyword(_varKeyword) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BaseType(
      BaseTypeKind.ANY,
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  identifier(component) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new Identifier(
      this.sourceString,
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  booleanLiteral(keyword) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new BoolLiteral(
      JSON.parse(this.sourceString),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  numberLiteral(
    component0,
    component1,
    component2,
    component3,
    component4,
    component5,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new NumberLiteral(
      Number(this.sourceString),
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  stringLiteral_doublequotes(_leftDoubleQuote, chars, _rightDoubleQuote) {
    const lineAndColumn = this.source.getLineAndColumn();
    const value = this.sourceString.slice(1, this.sourceString.length - 1);
    return new StringLiteral(
      value,
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  stringLiteral_singlequotes(_leftSingleQuote, chars, _rightSingleQuote) {
    const lineAndColumn = this.source.getLineAndColumn();
    const value = this.sourceString.slice(1, this.sourceString.length - 1);
    return new StringLiteral(
      value,
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  noneLiteral(keyword) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new NoneLiteral(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  NonemptyListWithOptionalEndSep(nonemptyList, possibleSeperator) {
    return nonemptyList.asIteration().ast();
  },
  _iter(...children) {
    return children.map((c) => c.ast());
  },
});
