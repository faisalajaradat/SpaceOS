import { grammar } from "./grammar.js";
import * as core from "./core.js";

export function ast(match) {
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
    return simpleStatements.ast()[0];
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
    return new core.FunCall(
      null,
      identifier.ast(),
      possibleFuncallArgs.ast()[0] ?? new Array<core.Expr>(),
    );
  },
  FuncallArgs(expr, nextArgs) {
    const args = nextArgs.ast();
    args.unshift(expr.ast());
    return args;
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
    return new core.BoolLiteral(JSON.parse(this.sourceString));
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

let dotString = "";
let nodeCount = 0;

export function visitDotPrinter(node: core.ASTNode): string {
  if (node instanceof core.Program) {
    dotString = dotString.concat("digraph ast {\n");
    const programNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(programNodeId + '[label=" Program "];\n');
    const declsNodeIds = new Array<string>();
    node
      .children()
      .forEach((child) => declsNodeIds.push(visitDotPrinter(child)));
    declsNodeIds.forEach(
      (nodeId) =>
        (dotString = dotString.concat(programNodeId + "->" + nodeId + ";\n")),
    );
    return dotString.concat("}");
  }
  if (node instanceof core.FunDeclaration) {
    const funDeclNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(funDeclNodeId + '[label=" FunDecl "];\n');
    const typeNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      typeNodeId + '[label=" ' + node.funType + ' "];\n',
    );
    const identifierNodeId = visitDotPrinter(node.identifier);
    let argsNodeId = "";
    if (node.argTypes.length > 0) {
      argsNodeId = "Node" + nodeCount++;
      dotString = dotString.concat(argsNodeId + '[label=" Args "];\n');
    }
    const argTypeIds = new Array<string>();
    const argIdentifierIds = new Array<string>();
    for (let i = 0; i < node.argTypes.length; i++) {
      const argTypeId = "Node" + nodeCount++;
      argTypeIds.push(argTypeId);
      dotString = dotString.concat(
        argTypeId + '[label=" ' + node.argTypes[i] + ' "];\n',
      );
      argIdentifierIds.push(visitDotPrinter(node.argIdentifiers[i]));
    }
    const blockNodeId = visitDotPrinter(node.block);
    dotString = dotString.concat(funDeclNodeId + "->" + typeNodeId + ";\n");
    dotString = dotString.concat(
      funDeclNodeId + "->" + identifierNodeId + ";\n",
    );
    if (argsNodeId != "") {
      dotString = dotString.concat(funDeclNodeId + "->" + argsNodeId + ";\n");
      for (let i = 0; i < node.argTypes.length; i++) {
        dotString = dotString.concat(argsNodeId + "->" + argTypeIds[i] + ";\n");
        dotString = dotString.concat(
          argsNodeId + "->" + argIdentifierIds[i] + ";\n",
        );
      }
    }
    dotString = dotString.concat(funDeclNodeId + "->" + blockNodeId + ";\n");
    return funDeclNodeId;
  }
  if (node instanceof core.VarDeclaration) {
    const varDeclNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(varDeclNodeId + '[label=" = "];\n');
    const typeNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      typeNodeId + "[label= " + node.stmtType + "];\n",
    );
    const identifierNodeId = visitDotPrinter(node.identifier);
    const valueNodeId = visitDotPrinter(node.value);
    dotString = dotString.concat(varDeclNodeId + "->" + typeNodeId + ";\n");
    dotString = dotString.concat(
      varDeclNodeId + "->" + identifierNodeId + ";\n",
    );
    dotString = dotString.concat(varDeclNodeId + "->" + valueNodeId + ";\n");
    return varDeclNodeId;
  }
  if (node instanceof core.Return) {
    const returnNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(returnNodeId + '[label=" return "];\n');
    if (node.possibleValue == null) return returnNodeId;
    const valueNodeId = visitDotPrinter(node.possibleValue);
    dotString = dotString.concat(returnNodeId + "->" + valueNodeId + ";\n");
    return returnNodeId;
  }
  if (node instanceof core.If) {
    const ifNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(ifNodeId + '[label=" if "];\n');
    let elseStmtNodeId = "";
    let elseNodeId = "";
    const conditionNodeId = visitDotPrinter(node.condition);
    const stmtNodeId = visitDotPrinter(node.ifStmt);
    if (node.possibleElseStmt != null) {
      elseNodeId = "Node" + nodeCount++;
      dotString = dotString.concat(elseNodeId + '[label=" else "];\n');
      elseStmtNodeId = visitDotPrinter(node.possibleElseStmt);
    }
    dotString = dotString.concat(ifNodeId + "->" + conditionNodeId + ";\n");
    dotString = dotString.concat(ifNodeId + "->" + stmtNodeId + ";\n");
    if (elseNodeId != "") {
      dotString = dotString.concat(ifNodeId + "->" + elseNodeId + ";\n");
      dotString = dotString.concat(elseNodeId + "->" + elseStmtNodeId + ";\n");
    }
    return ifNodeId;
  }
  if (node instanceof core.While) {
    const whileNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(whileNodeId + '[label=" while "];\n');
    const conditionNodeId = visitDotPrinter(node.condition);
    const stmtNodeId = visitDotPrinter(node.whileStmt);
    dotString = dotString.concat(whileNodeId + "->" + conditionNodeId + ";\n");
    dotString = dotString.concat(whileNodeId + "->" + stmtNodeId + ";\n");
    return whileNodeId;
  }
  if (node instanceof core.Block) {
    const blockNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(blockNodeId + '[label=" Block "];\n');
    const stmtIds = new Array<string>();
    node.stmts.forEach((stmt) => stmtIds.push(visitDotPrinter(stmt)));
    stmtIds.forEach(
      (nodeId) =>
        (dotString = dotString.concat(blockNodeId + "->" + nodeId + ";\n")),
    );
    return blockNodeId;
  }
  if (node instanceof core.BinaryExpr) {
    const opNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      opNodeId + '[label=" ' + node.operator + ' "];\n',
    );
    const leftExprId = visitDotPrinter(node.leftExpr);
    const rightExprId = visitDotPrinter(node.rightExpr);
    dotString = dotString.concat(opNodeId + "->" + leftExprId + ";\n");
    dotString = dotString.concat(opNodeId + "->" + rightExprId + ";\n");
    return opNodeId;
  }
  if (node instanceof core.UnaryExpr) {
    const opNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      opNodeId + '[label" ' + node.operator + ' "];\n',
    );
    const rightExprId = visitDotPrinter(node.expr);
    dotString = dotString.concat(opNodeId + "->" + rightExprId + ";\n");
    return opNodeId;
  }
  if (node instanceof core.ArrayAccess) {
    const arrayAccesseNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(arrayAccesseNodeId + '[label=" at "];\n');
    const arrayExprId = visitDotPrinter(node.arrayExpr);
    const accessExprId = visitDotPrinter(node.accessExpr);
    dotString = dotString.concat(
      arrayAccesseNodeId + "->" + arrayExprId + ";\n",
    );
    dotString = dotString.concat(
      arrayAccesseNodeId + "->" + accessExprId + ";\n",
    );
    return arrayAccesseNodeId;
  }
  if (node instanceof core.FunCall) {
    const funCallNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(funCallNodeId + '[label=" FunCall "];\n');
    const identifierNodeId = visitDotPrinter(node.identifier);
    const argNodeIds = new Array<string>();
    node.args.forEach((arg) => argNodeIds.push(visitDotPrinter(arg)));
    dotString = dotString.concat(
      funCallNodeId + "->" + identifierNodeId + ";\n",
    );
    argNodeIds.forEach(
      (nodeId) =>
        (dotString = dotString.concat(funCallNodeId + "->" + nodeId + ";\n")),
    );
    return funCallNodeId;
  }
  if (node instanceof core.StringLiteral) {
    const stringLiteralNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      stringLiteralNodeId + '[label=" ' + node.value + ' "];\n',
    );
    return stringLiteralNodeId;
  }
  if (node instanceof core.BoolLiteral) {
    const boolLiteralNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      boolLiteralNodeId + '[label=" ' + node.value + ' "];\n',
    );
    return boolLiteralNodeId;
  }
  if (node instanceof core.NumberLiteral) {
    const numberLiteralNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      numberLiteralNodeId + '[label=" ' + node.value + ' "];\n',
    );
    return numberLiteralNodeId;
  }
  if (node instanceof core.Identifier) {
    const identifierNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      identifierNodeId + '[label=" ' + node.value + ' "];\n',
    );
    return identifierNodeId;
  }
}
