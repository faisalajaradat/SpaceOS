import { getValueOfExpression } from "../../utils.js";
import { ASTNode, dotString, newNodeId } from "../program.js";
import { BaseType, BaseTypeKind } from "../type/primitive-types.js";
import { Expr } from "./Expr.js";
import { Identifier } from "./Identifier.js";

export class SymbolAccess extends Expr {
  locationExpr: Expr;
  symbol: Identifier;

  constructor(
    line: number,
    column: number,
    locationExpr: Expr,
    symbol: Identifier,
  ) {
    super(line, column, new BaseType(line, column, BaseTypeKind.NONE));
    this.locationExpr = locationExpr;
    this.symbol = symbol;
  }

  children(): Array<ASTNode> {
    const children = new Array<ASTNode>();
    children.push(this.locationExpr);
    return children;
  }

  print(): string {
    const symbolAccessNodeId = newNodeId();
    dotString.push(symbolAccessNodeId + '[label= " . "];\n');
    const locationExprNodeId = this.locationExpr.print();
    const symbolNodeId = this.symbol.print();
    dotString.push(
      symbolAccessNodeId + "->" + locationExprNodeId + ";\n",
      symbolAccessNodeId + "->" + symbolNodeId + ";\n",
    );
    return symbolAccessNodeId;
  }

  async evaluate(): Promise<unknown> {
    return await getValueOfExpression(this.symbol);
  }
}
