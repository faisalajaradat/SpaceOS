import {
  ArrayRepresentation,
  ASTNode,
  dotString,
  newNodeId,
  RuntimeType,
  SymbolDeclaration,
} from "../program.js";
import { getValueOfExpression } from "../../utils.js";
import { Expr, Identifier } from "./Expr.js";
import { FunDeclaration } from "./FunDeclaration.js";

export class BinaryExpr extends Expr {
  leftExpr: Expr;
  operator: string;
  rightExpr: Expr;

  constructor(
    type: RuntimeType,
    operator: string,
    leftExpr: Expr,
    rightExpr: Expr,
    line: number = -1,
    column: number = -1,
  ) {
    super(type, line, column);
    this.leftExpr = leftExpr;
    this.operator = operator;
    this.rightExpr = rightExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.leftExpr);
    children.push(this.rightExpr);
    return children;
  }

  print(): string {
    const opNodeId = newNodeId();
    dotString.push(opNodeId + '[label=" ' + this.operator + ' "];\n');
    const leftExprId = this.leftExpr.print();
    const rightExprId = this.rightExpr.print();
    dotString.push(opNodeId + "->" + leftExprId + ";\n");
    dotString.push(opNodeId + "->" + rightExprId + ";\n");
    return opNodeId;
  }

  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<unknown> {
    let leftHandExp = await this.leftExpr.evaluate(varStacks);
    const rightHandExp =
      this.rightExpr instanceof FunDeclaration
        ? this.rightExpr
        : getValueOfExpression(await this.rightExpr.evaluate(varStacks), varStacks);
    if (this.operator === "=") {
      if (leftHandExp instanceof Identifier) {
        const varStack = varStacks.get(
          <SymbolDeclaration>(<Identifier>leftHandExp).declaration,
        );
        varStack[varStack.length - 1] = rightHandExp;
      } else if (leftHandExp instanceof ArrayRepresentation)
        leftHandExp.array[leftHandExp.index] = rightHandExp;
      return rightHandExp;
    }
    leftHandExp = getValueOfExpression(leftHandExp, varStacks);
    switch (this.operator) {
      case "||":
        return <boolean>leftHandExp || <boolean>rightHandExp;
      case "&&":
        return <boolean>leftHandExp && <boolean>rightHandExp;
      case "==":
        return leftHandExp === rightHandExp;
      case "!=":
        return leftHandExp !== rightHandExp;
      case "<=":
        return <number>leftHandExp <= <number>rightHandExp;
      case "<":
        return <number>leftHandExp < <number>rightHandExp;
      case ">=":
        return <number>leftHandExp >= <number>rightHandExp;
      case ">":
        return <number>leftHandExp > <number>rightHandExp;
      case "+":
        return typeof leftHandExp === "number"
          ? <number>leftHandExp + <number>rightHandExp
          : <string>leftHandExp + <string>rightHandExp;
      case "-":
        return <number>leftHandExp - <number>rightHandExp;
      case "*":
        return <number>leftHandExp * <number>rightHandExp;
      case "/":
        return <number>leftHandExp / <number>rightHandExp;
      case "%":
        return <number>leftHandExp % <number>rightHandExp;
    }
  }
}
