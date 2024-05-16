import { grammar } from "./grammar.js";
import * as core from "./core.js";

export default function ast(match) {
  return astBuilder(match).ast();
}

const astBuilder = grammar.createSemantics().addOperation("ast", {
  Program(declarations) {
    return new core.Program(declarations.ast());
  },
  Declaration_stmt(stmt) {
    return stmt.ast();
  },
  Declaration_function(funDeclaration) {
    return funDeclaration.ast();
  },
  Stmt_simple(simpleStatements, _newline) {
    return simpleStatements.ast();
  },
  Stmt_compound(compoundStatement) {
    return compoundStatement.ast();
  },
  SimpleStmts(nonemptyListWithOptionalEndSep) {
    return nonemptyListWithOptionalEndSep.ast();
  },
  SimpleStmt_vardeclaration(varDeclaration) {
    return varDeclaration.ast();
  },
  SimpleStmt_return(returnKeyword, possibleExpression) {
    return new core.Return(null, possibleExpression.ast()[0] ?? null);
  },
  SimpleStmt_exp(expression) {
    return expression.ast();
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
      null,
      expression.ast(),
      ifStatement.ast(),
      possibleElseStatement.ast()[0] ?? null,
    );
  },
  CompoundStmt_while(whileKeyword, expression, statement) {
    return new core.While(null, expression.ast(), statement.ast());
  },
  Exp(expression9, possibleAssign) {
    const leftExpr = expression9.ast();
    const rightExpr = possibleAssign.ast();
    if (rightExpr.length == 0) return leftExpr;
    rightExpr[0].leftExpr = leftExpr;
    return rightExpr[0];
  },
  Exp9(expression8, logicalOrs) {
    let leftExpr = expression8.ast();
    const rightExprs = logicalOrs.ast();
    rightExprs.forEach((element) => {
      element.leftExpr = leftExpr;
      leftExpr = element;
    });
    return leftExpr;
  },
  Exp8(expression7, logicalAnds) {
    let leftExpr = expression7.ast();
    const rightExprs = logicalAnds.ast();
    rightExprs.forEach((element) => {
      element.leftExpr = leftExpr;
      leftExpr = element;
    });
    return leftExpr;
  },
  Exp7(expression6, equalities) {
    let leftExpr = expression6.ast();
    const rightExprs = equalities.ast();
    rightExprs.forEach((element) => {
      element.leftExpr = leftExpr;
      leftExpr = element;
    });
    return leftExpr;
  },
  Exp6(expression5, inequalities) {
    let leftExpr = expression5.ast();
    const rightExprs = inequalities.ast();
    rightExprs.forEach((element) => {
      element.leftExpr = leftExpr;
      leftExpr = element;
    });
    return leftExpr;
  },
  Exp5(expression4, sums) {
    let leftExpr = expression4.ast();
    const rightExprs = sums.ast();
    rightExprs.forEach((element) => {
      element.leftExpr = leftExpr;
      leftExpr = element;
    });
    return leftExpr;
  },
  Exp4(expression3, products) {
    let leftExpr = expression3.ast();
    const rightExprs = products.ast();
    rightExprs.forEach((element) => {
      element.leftExpr = leftExpr;
      leftExpr = element;
    });
    return leftExpr;
  },
  Exp3_unary(unary) {
    return unary.ast();
  },
  Exp3_other(expression2) {
    return expression2.ast();
  },
  Exp2(expression1, arrayAccesses) {
    let leftExpr = expression1.ast();
    const accessExprs = arrayAccesses.ast();
    accessExprs.forEach((element) => {
      leftExpr = new core.ArrayAccess(null, leftExpr, element);
    });
    return leftExpr;
  },
  Exp1_funcall(funCall) {
    return funCall.ast();
  },
  Exp1_parentheses(_leftParenthesis, expression, _rightParenthesis) {
    return expression.ast();
  },
  Exp1_strliteral(stringLiteral) {
    return stringLiteral.ast();
  },
  Exp1_boolliteral(booleanLiteral) {
    return booleanLiteral.ast();
  },
  Exp1_numliteral(numberLiteral) {
    return numberLiteral.ast();
  },
  Exp1_identifier(identifier) {
    return identifier.ast();
  },
  Assign(_equal, expression) {
    return new core.BinaryExpr(
      null,
      _equal.sourceString,
      null,
      expression.ast(),
    );
  },
  LogicalOr(_logicalOr, expression8) {
    return new core.BinaryExpr(
      null,
      _logicalOr.sourceString,
      null,
      expression8.ast(),
    );
  },
  LogicalAnd(_logicalAnd, expression7) {
    return new core.BinaryExpr(
      null,
      _logicalAnd.sourceString,
      null,
      expression7.ast(),
    );
  },
  Equality(_operator, expression6) {
    return new core.BinaryExpr(
      null,
      _operator.sourceString,
      null,
      expression6.ast(),
    );
  },
  Inequality(_operator, expression5) {
    return new core.BinaryExpr(
      null,
      _operator.sourceString,
      null,
      expression5.ast(),
    );
  },
  Sum(_operator, expression4) {
    return new core.BinaryExpr(
      null,
      _operator.sourceString,
      null,
      expression4.ast(),
    );
  },
  Product(_operator, expression3) {
    return new core.BinaryExpr(
      null,
      _operator.sourceString,
      null,
      expression3.ast(),
    );
  },
  Unary(_operator, expression3) {
    return new core.UnaryExpr(null, _operator.sourceString, expression3.ast());
  },
  ArrayAccess(_leftSquareBracket, expression, _rightSquareBracket) {
    return expression.ast();
  },
  Block(_leftBracket, statements, _rightBracket) {
    return new core.Block(null, statements.ast());
  },
  Funcall(
    identifier,
    _leftParenthesis,
    possibleFuncallArgs,
    _rightParenthesis,
  ) {
    return new core.FunCall(null, identifier.ast(), possibleFuncallArgs.ast());
  },
  FuncallArgs(expression, nextArgs) {
    return [expression.ast()].concat(nextArgs.ast());
  },
  NextArg(_comma, expression) {
    return expression.ast();
  },
  VarDeclaration(newIdentifier, _equal, expression) {
    const typeAndIdentifier = newIdentifier.ast();
    return new core.VarDeclaration(
      typeAndIdentifier.type,
      typeAndIdentifier.identifier,
      expression.ast(),
    );
  },
  FunDeclaration(
    newIdentifier,
    _leftParenthesis,
    possibleNewIdentifiers,
    _rightParenthesis,
    block,
  ) {
    const typeAndIdentifier = newIdentifier.ast();
    const argsTypesAndIdentifiers = possibleNewIdentifiers.asIteration().ast();
    const argTypes = new Array<string>();
    const argIdentifiers = new Array<core.Identifier>();
    argsTypesAndIdentifiers.forEach((element) => {
      argTypes.push(element.type);
      argIdentifiers.push(element.identifier);
    });
    return new core.FunDeclaration(
      typeAndIdentifier.type,
      typeAndIdentifier.identifier,
      argTypes,
      argIdentifiers,
      block.ast(),
    );
  },
  NewIdentifier(type, identifier) {
    return { type: type.ast(), identifier: identifier.ast() };
  },
  type(keyword, arrayBrackets) {
    return this.sourceString;
  },
  trueKeyword(_true) {
    return this.sourceString;
  },
  falseKeyword(_false) {
    return this.sourceString;
  },
  numberKeyword(_number) {
    return this.sourceString;
  },
  stringKeyword(_string) {
    return this.sourceString;
  },
  boolKeyword(_bool) {
    return this.sourceString;
  },
  voidKeyword(_void) {
    return this.sourceString;
  },
  whileKeyword(_while) {
    return this.sourceString;
  },
  ifKeyword(_if) {
    return this.sourceString;
  },
  elseKeyword(_else) {
    return this.sourceString;
  },
  identifier(letter, alphanumerics) {
    return new core.Identifier(null, this.sourceString);
  },
  booleanLiteral(keyword) {
    return new core.BoolLiteral(Boolean(this.sourceString));
  },
  numberLiteral(digits, possibleFloatComponent) {
    return new core.NumberLiteral(Number(this.sourceString));
  },
  floatComponent(_period, digits, possibleScientificNotationComponent) {
    return null;
  },
  scientificNotationComponent(_e, sign, digits) {
    return null;
  },
  stringLiteral_doublequotes(_leftDoubleQuote, chars, _rightDoubleQuote) {
    const value = this.sourceString.slice(1, this.sourceString.length - 1);
    return new core.StringLiteral(value);
  },
  stringLiteral_singlequotes(_leftSingleQuote, chars, _rightSingleQuote) {
    const value = this.sourceString.slice(1, this.sourceString.length - 1);
    return new core.StringLiteral(value);
  },
  char(anyChar) {
    return null;
  },
  whitespace_tabchar(tabChar) {
    return null;
  },
  whitespace_verticaltab(verticalTab) {
    return null;
  },
  whitespace_formfeed(formFeed) {
    return null;
  },
  whitespace_space(space) {
    return null;
  },
  whitespace_nobreakspace(noBreakSpace) {
    return null;
  },
  whitespace_byteordermark(byteOrderMark) {
    return null;
  },
  whitespace_spaceseperator(unicodeSpaceSeperator) {
    return null;
  },
  lineTerminator(lineTerminatorString) {
    return null;
  },
  unicodeSpaceSeparator(unicodeSpaceSeperatorString) {
    return null;
  },
  space(whitespaceOrLineTerminator) {
    return null;
  },
  newline_last(spaces, end) {
    return null;
  },
  newline_whitespace(whitespaces, lineTerminator) {
    return null;
  },
  NonemptyListWithOptionalEndSep(nonemptyList, possibleSeperator) {
    return nonemptyList.asIteration().ast();
  },
  _iter(...children) {
    return children.map((c) => c.ast());
  },
});
