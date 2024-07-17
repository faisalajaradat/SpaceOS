import { BaseType, BaseTypeKind } from "../type/index.js";
import {ASTNode, dotString, newNodeId, SymbolDeclaration} from "../program.js";
import { Expr } from "./Expr.js";

export class BoolLiteral extends Expr {
  value: boolean;

  constructor(value: boolean, line: number = -1, column: number = -1) {
    super(new BaseType(BaseTypeKind.BOOL), line, column);
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const boolLiteralNodeId = newNodeId();
    dotString.push(boolLiteralNodeId + '[label=" ' + this.value + ' "];\n');
    return boolLiteralNodeId;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<boolean> {
    return this.value;
  }
}
