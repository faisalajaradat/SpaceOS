import { BaseType, BaseTypeKind } from "../type/index.js";
import {ASTNode, dotString, newNodeId, SymbolDeclaration} from "../program.js";
import { Expr } from "./Expr.js";

export class NumberLiteral extends Expr {
  value: number;

  constructor(value: number, line: number = -1, column: number = -1) {
    super(new BaseType(BaseTypeKind.NUMBER), line, column);
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const numberLiteralNodeId = newNodeId();
    dotString.push(numberLiteralNodeId + '[label=" ' + this.value + ' "];\n');
    return numberLiteralNodeId;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<number> {
    return this.value;
  }
}
