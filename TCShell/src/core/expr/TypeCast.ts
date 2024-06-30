import {ASTNode, dotString, newNodeId, RuntimeType} from "../program.js";
import {Expr} from "./Expr.js";

export class TypeCast extends Expr {
  castedExpr: Expr;

  constructor(
    line: number,
    column: number,
    desiredType: RuntimeType,
    castedExpr: Expr,
  ) {
    super(line, column, desiredType);
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

  async evaluate(): Promise<unknown> {
    return await this.castedExpr.evaluate();
  }
}
