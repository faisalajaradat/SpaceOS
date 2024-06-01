import { grammar } from "./grammar.js";
import * as core from "./core.js";
import { inspect } from "util";

export function ast(match) {
  return astBuilder(match).ast();
}
//Describe how to build AST for each Ohm rule
const astBuilder = grammar.createSemantics().addOperation("ast", {
  Program(stmts) {
    return new core.Program(stmts.ast());
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
    return new core.Return(possibleExpression.ast()[0] ?? null);
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
    return new core.AnonymousFunDeclaration(
      type.ast(),
      listOfParameters.asIteration().ast(),
      stmt.ast(),
    );
  },
  PrimaryExp_type(listOfTypes) {
    return listOfTypes.asIteration().ast();
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
  FunDeclaration(
    parameter,
    _leftParenthesis,
    possibleParameters,
    _rightParenthesis,
    stmt,
  ) {
    const typeAndIdentifier = parameter.ast();
    return new core.FunDeclaration(
      typeAndIdentifier.stmtType,
      typeAndIdentifier.identifier,
      possibleParameters.asIteration().ast(),
      stmt.ast(),
    );
  },
  TypeDeclaration(typeType, _equal, expression) {
    const _type = <core.TypeType>typeType.ast();
    _type.types.push(...expression.ast());
    return _type;
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
  TypeSpecifier_array(specifier) {
    return this.sourceString;
  },
  TypeSpecifier_function(_leftParenthesis, listOfTypes, _rightParenthesis) {
    return new core.FunctionType(null, listOfTypes.asIteration().ast());
  },
  TypeType(_type, identifier) {
    return new core.TypeType(identifier.ast(), new Array<core.TypeType>());
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
  NonemptyListWithOptionalEndSep(nonemptyList, possibleSeperator) {
    return nonemptyList.asIteration().ast();
  },
  _iter(...children) {
    return children.map((c) => c.ast());
  },
});

let dotString = "";
let nodeCount = 0;

function writeFunDeclarationDot(
  node: core.FunDeclaration | core.AnonymousFunDeclaration,
  funDeclNodeId: string,
): void {
  const typeNodeId = visitDotPrinter(node.stmtType);
  const paramNodeIds = new Array<string>();
  node.params.forEach((child) => paramNodeIds.push(visitDotPrinter(child)));
  const blockNodeId = visitDotPrinter(node._body);
  dotString = dotString.concat(funDeclNodeId + "->" + typeNodeId + ";\n");
  paramNodeIds.forEach(
    (nodeId) =>
      (dotString = dotString.concat(funDeclNodeId + "->" + nodeId + ";\n")),
  );
  dotString = dotString.concat(funDeclNodeId + "->" + blockNodeId + ";\n");
}

//Convert AST into DOT language
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
    const identifierNodeId = visitDotPrinter(node.identifier);
    dotString = dotString.concat(
      funDeclNodeId + "->" + identifierNodeId + ";\n",
    );
    writeFunDeclarationDot(node, funDeclNodeId);
    return funDeclNodeId;
  }
  if (node instanceof core.Parameter) {
    const paramNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(paramNodeId + '[label=" Param "];\n');
    const typeNodeId = visitDotPrinter(node.stmtType);
    const identifierNodeId = visitDotPrinter(node.identifier);
    dotString = dotString.concat(paramNodeId + "->" + typeNodeId + ";\n");
    dotString = dotString.concat(paramNodeId + "->" + identifierNodeId + ";\n");
    return paramNodeId;
  }
  if (node instanceof core.VarDeclaration) {
    const varDeclNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(varDeclNodeId + '[label=" = "];\n');
    const typeNodeId = visitDotPrinter(node.stmtType);
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
    if (node.possibleValue === null) return returnNodeId;
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
    if (node.possibleElseStmt !== null) {
      elseNodeId = "Node" + nodeCount++;
      dotString = dotString.concat(elseNodeId + '[label=" else "];\n');
      elseStmtNodeId = visitDotPrinter(node.possibleElseStmt);
    }
    dotString = dotString.concat(ifNodeId + "->" + conditionNodeId + ";\n");
    dotString = dotString.concat(ifNodeId + "->" + stmtNodeId + ";\n");
    if (elseNodeId !== "") {
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
  if (node instanceof core.AttributeAccess) {
    const attributeAccessNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(attributeAccessNodeId + '[label=" . "];\n');
    const containerExprId = visitDotPrinter(node.containerExpr);
    const callExprId = visitDotPrinter(node.callExpr);
    dotString = dotString.concat(
      attributeAccessNodeId + "->" + containerExprId + ";\n",
    );
    dotString = dotString.concat(
      attributeAccessNodeId + "->" + callExprId + ";\n",
    );
    return attributeAccessNodeId;
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
  if (node instanceof core.AnonymousFunDeclaration) {
    const anonymousFunDeclNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      anonymousFunDeclNodeId + '[label=" AnonFunDecl "];\n',
    );
    writeFunDeclarationDot(node, anonymousFunDeclNodeId);
    return anonymousFunDeclNodeId;
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
  if (node instanceof core.ArrayLiteral) {
    const arrayNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(arrayNodeId + '[label=" Array "];\n');
    const elementIds = new Array<string>();
    node.children().forEach((child) => elementIds.push(visitDotPrinter(child)));
    elementIds.forEach(
      (nodeId) =>
        (dotString = dotString.concat(arrayNodeId + "->" + nodeId + ";\n")),
    );
    return arrayNodeId;
  }
  if (node instanceof core.BaseType) {
    const typeNodeId = "Node" + nodeCount++;
    let label = "";
    switch (node.kind) {
      case core.BaseTypeKind.NUMBER:
        label = "number";
        break;
      case core.BaseTypeKind.STRING:
        label = "string";
        break;
      case core.BaseTypeKind.BOOL:
        label = "bool";
        break;
      case core.BaseTypeKind.VOID:
        label = "void";
        break;
      case core.BaseTypeKind.NONE:
        break;
    }
    dotString = dotString.concat(typeNodeId + '[label=" ' + label + ' "];\n');
    return typeNodeId;
  }
  if (node instanceof core.ArrayType) {
    const arrayTypeNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(arrayTypeNodeId + '[label=" Array Of "];\n');
    const typeNodeId = visitDotPrinter(node._type);
    dotString = dotString.concat(arrayTypeNodeId + "->" + typeNodeId + ";\n");
    return arrayTypeNodeId;
  }
  if (node instanceof core.FunctionType) {
    const functionTypeNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(
      functionTypeNodeId + '[label=" Function "];\n',
    );
    const typeNodeId = visitDotPrinter(node.returnType);
    dotString = dotString.concat(
      functionTypeNodeId + "->" + typeNodeId + ";\n",
    );
    node.paramTypes
      .map((paramType) => visitDotPrinter(paramType))
      .forEach(
        (nodeId) =>
          (dotString = dotString.concat(
            functionTypeNodeId + "->" + nodeId + ";\n",
          )),
      );
    return functionTypeNodeId;
  }
  if (node instanceof core.TypeType) {
    const typeTypeNodeId = "Node" + nodeCount++;
    dotString = dotString.concat(typeTypeNodeId + '[label=" Type "];\n');
    const identifierNodeId = visitDotPrinter(node.identifier);
    dotString = dotString.concat(
      typeTypeNodeId + "->" + identifierNodeId + ";\n",
    );
    node.types
      .map((_type) => visitDotPrinter(_type))
      .forEach(
        (nodeId) =>
          (dotString = dotString.concat(
            typeTypeNodeId + "->" + nodeId + ";\n",
          )),
      );
    return typeTypeNodeId;
  }
}
