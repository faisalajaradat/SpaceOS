import { getValueOfExpression } from "../../utils.js";
import { ASTNode, dotString, newNodeId } from "../program.js";
import { ImportDeclaration } from "../stmts.js";
import { BaseType, BaseTypeKind } from "../type/primitive-types.js";
import { Expr, Identifier } from "./Expr.js";

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
    if (
      this.locationExpr instanceof Identifier &&
      this.locationExpr.declaration instanceof ImportDeclaration
    )
      return getValueOfExpression(await this.symbol.evaluate());
    return getValueOfExpression(await this.locationExpr.evaluate())[
      this.symbol.value
    ];
  }
}
