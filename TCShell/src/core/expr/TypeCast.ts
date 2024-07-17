import {ASTNode, dotString, newNodeId, RuntimeType, SymbolDeclaration} from "../program.js";
import { Expr } from "./Expr.js";
import {getValueOfExpression} from "../../utils.js";

export class TypeCast extends Expr {
  castedExpr: Expr;

  constructor(
    desiredType: RuntimeType,
    castedExpr: Expr,
    line: number = -1,
    column: number = -1,
  ) {
    super(desiredType, line, column);
    this.castedExpr = castedExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this._type);
    children.push(this.castedExpr);
    return children;
  }

  print(): string {
    const typeCastNodeId = newNodeId();
    dotString.push(typeCastNodeId + '[label=" TypeCast "];\n');
    const desiredTypeNodeId = this._type.print();
    const castedExprNodeId = this.castedExpr.print();
    dotString.push(typeCastNodeId + "->" + desiredTypeNodeId + ";\n");
    dotString.push(typeCastNodeId + "->" + castedExprNodeId + ";\n");
    return typeCastNodeId;
  }

  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<unknown> {
    return getValueOfExpression(await this.castedExpr.evaluate(varStacks), varStacks);
  }
}
