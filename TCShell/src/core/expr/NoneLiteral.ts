import { BaseType, BaseTypeKind } from "../type/index.js";
import {ASTNode, dotString, newNodeId, SymbolDeclaration} from "../program.js";
import { Expr } from "./Expr.js";

export class NoneLiteral extends Expr {
  value: undefined;

  constructor(line: number = -1, column: number = -1) {
    super(new BaseType(BaseTypeKind.VOID), line, column);
    this.value = undefined;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const noneLiteralNodeId = newNodeId();
    dotString.push(noneLiteralNodeId + '[label= " None " ];\n');
    return noneLiteralNodeId;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<undefined> {
    return this.value;
  }
}