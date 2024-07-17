import { BaseType, BaseTypeKind } from "../type/index.js";
import {ASTNode, dotString, newNodeId, SymbolDeclaration} from "../program.js";
import { Expr } from "./Expr.js";

export class StringLiteral extends Expr {
  value: string;

  constructor(value: string, line: number = -1, column: number = -1) {
    super(new BaseType(BaseTypeKind.STRING), line, column);
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const stringLiteralNodeId = newNodeId();
    dotString.push(stringLiteralNodeId + '[label=" ' + this.value + ' "];\n');
    return stringLiteralNodeId;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async evaluate(varStacks: Map<SymbolDeclaration, unknown[]>): Promise<string> {
    return this.value;
  }
}