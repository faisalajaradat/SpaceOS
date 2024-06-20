import { grammar } from "./grammar.js";
import * as core from "./core.js";

export function ast(match) {
  return astBuilder(match).ast();
}
//Describe how to build AST for each Ohm rule
const astBuilder = grammar.createSemantics().addOperation("ast", {
  Program(stmts) {
    const lineAndColumn = this.source.getLineAndColumn();
    const _program = new core.Program(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      stmts.ast(),
    );
    core.libFunctions.forEach((value, key) => _program.stmts.unshift(key));
    return _program;
  },
  Stmt_simple(simpleStatements, _newline) {
    return simpleStatements.ast()[0];
  },
  Stmt_compound(compoundStatement) {
    return compoundStatement.ast();
  },
  SimpleStmts(nonemptyListWithOptionalEndSep) {
    return nonemptyListWithOptionalEndSep.ast();
  },
  SimpleStmt_return(returnKeyword, possibleExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.Return(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      possibleExpression.ast()[0],
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
    return new core.If(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      expression.ast(),
      ifStatement.ast(),
      possibleElseStatement.ast()[0] ?? null,
    );
  },
  CompoundStmt_while(whileKeyword, expression, statement) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.While(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      expression.ast(),
      statement.ast(),
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
    return new core.Match(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      expression.ast(),
      caseStmts.ast(),
    );
  },
  CaseStmt(condition, _arrow, stmt) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.CaseStmt(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      condition.ast(),
      stmt.ast(),
    );
  },
  Exp(assignExpression) {
    return assignExpression.ast();
  },
  AssignExp_assign(unaryExpression, _equal, assignExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.BinaryExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      _equal.sourceString,
      unaryExpression.ast(),
      assignExpression.ast(),
    );
  },
  AssignExp(lorExpression) {
    return lorExpression.ast();
  },
  LorExp_lor(lorExpression, _lor, larExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.BinaryExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      _lor.sourceString,
      lorExpression.ast(),
      larExpression.ast(),
    );
  },
  LorExp(larExpression) {
    return larExpression.ast();
  },
  LarExp_lar(larExpression, _lar, eqExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.BinaryExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      _lar.sourceString,
      larExpression.ast(),
      eqExpression.ast(),
    );
  },
  LarExp(eqExpression) {
    return eqExpression.ast();
  },
  EqExp_eq(eqExpression, operator, relExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.BinaryExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      operator.sourceString,
      eqExpression.ast(),
      relExpression.ast(),
    );
  },
  EqExp(relExpression) {
    return relExpression.ast();
  },
  RelExp_rel(relExpression, operator, addExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.BinaryExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      operator.sourceString,
      relExpression.ast(),
      addExpression.ast(),
    );
  },
  RelExp(addExpression) {
    return addExpression.ast();
  },
  AddExp_add(addExpression, operator, multExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.BinaryExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      operator.sourceString,
      addExpression.ast(),
      multExpression.ast(),
    );
  },
  AddExp(multExpression) {
    return multExpression.ast();
  },
  MultExp_mult(multExpression, operator, unaryExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.BinaryExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      operator.sourceString,
      multExpression.ast(),
      unaryExpression.ast(),
    );
  },
  MultExp(unaryExpression) {
    return unaryExpression.ast();
  },
  UnaryExp_unary(operator, unaryExpression) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.UnaryExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      operator.sourceString,
      unaryExpression.ast(),
    );
  },
  UnaryExp_typecast(
    _leftParenthesis,
    _type,
    _rightParenthesis,
    unaryExpression,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.TypeCast(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      _type.ast(),
      unaryExpression.ast(),
    );
  },
  UnaryExp_new(_new, spatialType, _leftParenthesis, args, _rightParenthesis) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.SpacialObjectInstantiationExpr(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      spatialType.ast(),
      args.asIteration().ast(),
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
    return new core.FunCall(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      leftExpression.ast(),
      listOfExpressions.asIteration().ast(),
    );
  },
  LeftExp_array(
    leftExpression,
    _leftSquareBracket,
    expression,
    _rightSquareBracket,
  ) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.ArrayAccess(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      leftExpression.ast(),
      expression.ast(),
    );
  },
  LeftExp(primaryExpression) {
    return primaryExpression.ast();
  },
  PrimaryExp_group(_leftParenthesis, expression, _rightParenthesis) {
    return expression.ast();
  },
  PrimaryExp_array(_leftBracket, listOfExpressions, _rightBracket) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.ArrayLiteral(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      listOfExpressions.asIteration().ast(),
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
    return new core.FunDeclaration(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      type.ast(),
      params,
      stmt.ast(),
    );
  },
  PrimaryExp(expression) {
    return expression.ast();
  },
  Block(_leftBracket, statements, _rightBracket) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.Block(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      statements.ast(),
    );
  },
  VarDeclaration(parameter, _equal, expression) {
    const lineAndColumn = this.source.getLineAndColumn();
    const typeAndIdentifier = parameter.ast();
    return new core.VarDeclaration(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      typeAndIdentifier.stmtType,
      typeAndIdentifier.identifier,
      expression.ast(),
    );
  },
  UnionDeclaration(unionType, _equal, listOfTypes) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.UnionDeclaration(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      unionType.ast(),
      listOfTypes.asIteration().ast(),
    );
  },
  Parameter(type, identifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.Parameter(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      type.ast(),
      identifier.ast(),
    );
  },
  Type(baseTypeDef, typeSpecifiers) {
    const baseType = baseTypeDef.ast();
    const numOfSpecifiers = <(core.ArrayType | core.FunctionType)[]>(
      typeSpecifiers.ast()
    );
    let fullType = baseType;
    numOfSpecifiers.forEach((specifier) => {
      if (specifier instanceof core.ArrayType) {
        (<core.ArrayType>specifier)._type = fullType;
        fullType = specifier;
      } else if (specifier instanceof core.FunctionType) {
        (<core.FunctionType>specifier).returnType = fullType;
        fullType = specifier;
      }
    });
    return fullType;
  },
  baseTypeKeyword(keyword) {
    const lineAndColumn = this.source.getLineAndColumn();
    let baseTypeKind = core.BaseTypeKind.NONE;
    switch (keyword.sourceString) {
      case "number":
        baseTypeKind = core.BaseTypeKind.NUMBER;
        break;
      case "string":
        baseTypeKind = core.BaseTypeKind.STRING;
        break;
      case "bool":
        baseTypeKind = core.BaseTypeKind.BOOL;
        break;
      case "void":
        baseTypeKind = core.BaseTypeKind.VOID;
        break;
    }
    return new core.BaseType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      baseTypeKind,
    );
  },
  UnionType(_union, identifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.UnionType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      identifier.ast(),
    );
  },
  TypeSpecifier_array(specifier) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.ArrayType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      -1,
    );
  },
  TypeSpecifier_function(_leftParenthesis, listOfTypes, _rightParenthesis) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.FunctionType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      null,
      listOfTypes.asIteration().ast(),
    );
  },
  SpatialType(spatialType) {
    return spatialType.ast();
  },
  MaybeVirtualSpatialType(possibleVirtualOrPhysical, spatialType) {
    const maybeVirtualSpatialType: core.SpatialType = spatialType.ast();
    const localityDescriptor = possibleVirtualOrPhysical.ast()[0];
    const localityLineAndColumn =
      possibleVirtualOrPhysical.source.getLineAndColumn();
    return localityDescriptor === undefined
      ? maybeVirtualSpatialType
      : localityDescriptor === "physical"
        ? new core.PhysicalDecorator(
            localityLineAndColumn.lineNum,
            localityLineAndColumn.colNum,
            maybeVirtualSpatialType,
          )
        : new core.VirtualDecorator(
            localityLineAndColumn.lineNum,
            localityLineAndColumn.colNum,
            maybeVirtualSpatialType,
          );
  },
  MaybeImmutableSpatialType(possibleImmutableOrMutable, spatialType) {
    const maybeImmutableSpatialType: core.SpatialObjectType = spatialType.ast();
    const controllDescriptor = possibleImmutableOrMutable.ast()[0];
    const controllLineAndColumn =
      possibleImmutableOrMutable.source.getLineAndColumn();
    return controllDescriptor === undefined
      ? maybeImmutableSpatialType
      : controllDescriptor === "mutable"
        ? new core.ControlledDecorator(
            controllLineAndColumn.lineNum,
            controllLineAndColumn.colNum,
            maybeImmutableSpatialType,
          )
        : new core.NotControlledDecorator(
            controllLineAndColumn.lineNum,
            controllLineAndColumn.colNum,
            maybeImmutableSpatialType,
          );
  },
  MaybeMobileSpatialType(possibleMobileOrStationary, spatialType) {
    const maybeMobileSpatialType: core.DynamicEntityType = spatialType.ast();
    const motionDescriptor = possibleMobileOrStationary.ast()[0];
    const motionLineAndColumn =
      possibleMobileOrStationary.source.getLineAndColumn();
    return motionDescriptor === undefined
      ? maybeMobileSpatialType
      : motionDescriptor === "stationary"
        ? new core.StationaryDecorator(
            motionLineAndColumn.lineNum,
            motionLineAndColumn.colNum,
            maybeMobileSpatialType,
          )
        : new core.MobileDecorator(
            motionLineAndColumn.lineNum,
            motionLineAndColumn.colNum,
            maybeMobileSpatialType,
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
  spatialTypeKeyword(_spatialType) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.SpatialType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  landPath(_landPath) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.PhysicalDecorator(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      new core.LandPathType(lineAndColumn.lineNum, lineAndColumn.colNum),
    );
  },
  airPath(_airPath) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.PhysicalDecorator(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      new core.AirPathType(lineAndColumn.lineNum, lineAndColumn.colNum),
    );
  },
  spaceFactory(_spaceFactory) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.SpaceFactoryType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  entityFactory(_entityFactory) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.EntityFactoryType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  pathFactory(_pathFactory) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.PathFactoryType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  path(_path) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.PathType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  spaceKeyword(_space) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.SpaceType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  openSpace(_openSpace) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.OpenSpaceType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  enclosedSpace(_enclosedSpace) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.EnclosedSpaceType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  entity(_entity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.EntityType(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  staticEntity(_staticEntity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.StaticEntityType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  dynamicEntity(_dynamicEntity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.DynamicEntityType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  animateEntity(_animateEntity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.AnimateEntityType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  smartEntity(_smartEntity) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.SmartEntityType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  spacePathGraph(_spacePathGraph) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.SpacePathGraphType(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
    );
  },
  wildcard(_underscore) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.Parameter(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      new core.BaseType(-1, -1, core.BaseTypeKind.ANY),
      new core.Identifier(lineAndColumn.lineNum, lineAndColumn.colNum, "_"),
    );
  },
  identifier(component) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.Identifier(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      this.sourceString,
    );
  },
  booleanLiteral(keyword) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.BoolLiteral(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      JSON.parse(this.sourceString),
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
    return new core.NumberLiteral(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      Number(this.sourceString),
    );
  },
  stringLiteral_doublequotes(_leftDoubleQuote, chars, _rightDoubleQuote) {
    const lineAndColumn = this.source.getLineAndColumn();
    const value = this.sourceString.slice(1, this.sourceString.length - 1);
    return new core.StringLiteral(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      value,
    );
  },
  stringLiteral_singlequotes(_leftSingleQuote, chars, _rightSingleQuote) {
    const lineAndColumn = this.source.getLineAndColumn();
    const value = this.sourceString.slice(1, this.sourceString.length - 1);
    return new core.StringLiteral(
      lineAndColumn.lineNum,
      lineAndColumn.colNum,
      value,
    );
  },
  noneLiteral(keyword) {
    const lineAndColumn = this.source.getLineAndColumn();
    return new core.NoneLiteral(lineAndColumn.lineNum, lineAndColumn.colNum);
  },
  NonemptyListWithOptionalEndSep(nonemptyList, possibleSeperator) {
    return nonemptyList.asIteration().ast();
  },
  _iter(...children) {
    return children.map((c) => c.ast());
  },
});
