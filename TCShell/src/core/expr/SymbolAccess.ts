import { getValueOfExpression } from "../../utils.js";
import {ASTNode, dotString, newNodeId, SymbolDeclaration} from "../program.js";
import { ImportDeclaration } from "../stmts.js";
import { BaseType, BaseTypeKind } from "../type/index.js";
import { Expr, Identifier } from "./Expr.js";

export class SymbolAccess extends Expr {
  locationExpr: Expr;
  symbol: Identifier;

  constructor(
    locationExpr: Expr,
    symbol: Identifier,
    line: number = -1,
    column: number = -1,
  ) {
    super(new BaseType(BaseTypeKind.NONE), line, column);
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

  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<unknown> {
    if (
      this.locationExpr instanceof Identifier &&
      this.locationExpr.declaration instanceof ImportDeclaration
    )
      return getValueOfExpression(await this.symbol.evaluate(varStacks), varStacks);
    return getValueOfExpression(await this.locationExpr.evaluate(varStacks), varStacks)[
      this.symbol.value
    ];
  }
}
