import { grammar } from "./grammar.js";
import * as core from "./core.js";

export function ast(match) {
  return astBuilder(match).ast();
}
//Describe how to build AST for each Ohm rule
const astBuilder = grammar.createSemantics().addOperation("ast", {
  Program(stmts) {
    const _program = new core.Program(stmts.ast());
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
    return new core.Return(possibleExpression.ast()[0]);
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
    return new core.If(
      expression.ast(),
      ifStatement.ast(),
      possibleElseStatement.ast()[0] ?? null,
    );
  },
  CompoundStmt_while(whileKeyword, expression, statement) {
    return new core.While(expression.ast(), statement.ast());
  },
  CompoundStmt_match(
    _match,
    expression,
    _leftBracket,
    caseStmts,
    _rightBracket,
  ) {
    return new core.Match(expression.ast(), caseStmts.ast());
  },
  CaseStmt(condition, _arrow, stmt) {
    return new core.CaseStmt(condition.ast(), stmt.ast());
  },
  Exp(assignExpression) {
    return assignExpression.ast();
  },
  AssignExp_assign(unaryExpression, _equal, assignExpression) {
    return new core.BinaryExpr(
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
    return new core.BinaryExpr(
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
    return new core.BinaryExpr(
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
    return new core.BinaryExpr(
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
    return new core.BinaryExpr(
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
    return new core.BinaryExpr(
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
    return new core.BinaryExpr(
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
    return new core.UnaryExpr(
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
    return new core.TypeCast(_type.ast(), unaryExpression.ast());
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
    return new core.FunCall(
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
    return new core.ArrayAccess(leftExpression.ast(), expression.ast());
  },
  LeftExp_attribute(leftExpression, _dot, expression) {
    return new core.AttributeAccess(leftExpression.ast(), expression.ast());
  },
  LeftExp(primaryExpression) {
    return primaryExpression.ast();
  },
  PrimaryExp_group(_leftParenthesis, expression, _rightParenthesis) {
    return expression.ast();
  },
  PrimaryExp_array(_leftBracket, listOfExpressions, _rightBracket) {
    return new core.ArrayLiteral(listOfExpressions.asIteration().ast());
  },
  PrimaryExp_function(
    type,
    _leftParenthesis,
    listOfParameters,
    _rightParenthesis,
    stmt,
  ) {
    const params =
      listOfParameters.sourceString === "none"
        ? []
        : listOfParameters.asIteration().ast();
    return new core.FunDeclaration(type.ast(), params, stmt.ast());
  },
  PrimaryExp(expression) {
    return expression.ast();
  },
  Block(_leftBracket, statements, _rightBracket) {
    return new core.Block(statements.ast());
  },
  VarDeclaration(parameter, _equal, expression) {
    const typeAndIdentifier = parameter.ast();
    return new core.VarDeclaration(
      typeAndIdentifier.stmtType,
      typeAndIdentifier.identifier,
      expression.ast(),
    );
  },
  UnionDeclaration(unionType, _equal, listOfTypes) {
    return new core.UnionDeclaration(
      unionType.ast(),
      listOfTypes.asIteration().ast(),
    );
  },
  Parameter(type, identifier) {
    return new core.Parameter(type.ast(), identifier.ast());
  },
  Type(baseTypeDef, typeSpecifiers) {
    const baseType = baseTypeDef.ast();
    const numOfSpecifiers = <(string | core.FunctionType)[]>(
      typeSpecifiers.ast()
    );
    let fullType = baseType;
    numOfSpecifiers.forEach((specifier) => {
      if (typeof specifier === "string" && specifier === "[]")
        fullType = new core.ArrayType(fullType, -1);
      else if (specifier instanceof core.FunctionType) {
        (<core.FunctionType>specifier).returnType = fullType;
        fullType = specifier;
      }
    });
    return fullType;
  },
  baseTypeKeyword(keyword) {
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
    return new core.BaseType(baseTypeKind);
  },
  UnionType(_union, identifier) {
    return new core.UnionType(identifier.ast());
  },
  TypeSpecifier_array(specifier) {
    return this.sourceString;
  },
  TypeSpecifier_function(_leftParenthesis, listOfTypes, _rightParenthesis) {
    return new core.FunctionType(null, listOfTypes.asIteration().ast());
  },
  SpatialType(spatialType) {
    return spatialType.ast();
  },
  MaybeVirtualSpatialType(possibleVirtualOrPhysical, spatialType) {
    const maybeVirtualSpatialType: core.SpatialType = spatialType.ast();
    const localityDescriptor = possibleVirtualOrPhysical.ast()[0];
    return localityDescriptor === undefined
      ? maybeVirtualSpatialType
      : localityDescriptor === "physical"
        ? new core.PhysicalDecorator(maybeVirtualSpatialType)
        : new core.VirtualDecorator(maybeVirtualSpatialType);
  },
  MaybeImmutableSpatialType(possibleImmutableOrMutable, spatialType) {
    const maybeImmutableSpatialType: core.SpatialObjectType = spatialType.ast();
    const controllDescriptor = possibleImmutableOrMutable.ast()[0];
    return controllDescriptor === undefined
      ? maybeImmutableSpatialType
      : controllDescriptor === "mutable"
        ? new core.ControlledDecorator(maybeImmutableSpatialType)
        : new core.NotControlledDecorator(maybeImmutableSpatialType);
  },
  MaybeMobileSpatialType(possibleMobileOrStationary, spatialType) {
    const maybeMobileSpatialType: core.DynamicEntityType = spatialType.ast();
    const motionDescriptor = possibleMobileOrStationary.ast()[0];
    return motionDescriptor === undefined
      ? maybeMobileSpatialType
      : motionDescriptor === "stationary"
        ? new core.StationaryDecorator(maybeMobileSpatialType)
        : new core.MobileDecorator(maybeMobileSpatialType);
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
  landPath(_landPath) {
    return new core.PhysicalDecorator(new core.LandPathType());
  },
  airPath(_airPath) {
    return new core.PhysicalDecorator(new core.AirPathType());
  },
  path(_path) {
    return new core.PathType();
  },
  spaceKeyword(_space) {
    return new core.SpaceType();
  },
  openSpace(_openSpace) {
    return new core.OpenSpaceType();
  },
  enclosedSpace(_enclosedSpace) {
    return new core.EnclosedSpaceType();
  },
  entity(_entity) {
    return new core.EntityType();
  },
  staticEntity(_staticEntity) {
    return new core.StaticEntityType();
  },
  dynamicEntity(_dynamicEntity) {
    return new core.DynamicEntityType();
  },
  animateEntity(_animateEntity) {
    return new core.AnimateEntityType();
  },
  smartEntity(_smartEntity) {
    return new core.SmartEntityType();
  },
  identifier(component) {
    return new core.Identifier(this.sourceString);
  },
  booleanLiteral(keyword) {
    return new core.BoolLiteral(JSON.parse(this.sourceString));
  },
  numberLiteral(
    component0,
    component1,
    component2,
    component3,
    component4,
    component5,
  ) {
    return new core.NumberLiteral(Number(this.sourceString));
  },
  stringLiteral_doublequotes(_leftDoubleQuote, chars, _rightDoubleQuote) {
    const value = this.sourceString.slice(1, this.sourceString.length - 1);
    return new core.StringLiteral(value);
  },
  stringLiteral_singlequotes(_leftSingleQuote, chars, _rightSingleQuote) {
    const value = this.sourceString.slice(1, this.sourceString.length - 1);
    return new core.StringLiteral(value);
  },
  noneLiteral(keyword) {
    return new core.NoneLiteral();
  },
  NonemptyListWithOptionalEndSep(nonemptyList, possibleSeperator) {
    return nonemptyList.asIteration().ast();
  },
  _iter(...children) {
    return children.map((c) => c.ast());
  },
});
